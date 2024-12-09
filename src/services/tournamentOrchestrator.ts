import { supabase } from '@/lib/supabase';
import { Tournament, TournamentMatch, Player } from '@/types/tournament';
import { TournamentService } from './tournamentService';
import { TournamentMatchmaking } from './tournamentMatchmaking';
import { TournamentAnalytics } from './tournamentAnalytics';
import { TournamentNotification } from './tournamentNotification';
import { TournamentCache } from './tournamentCache';
import { TournamentError } from '@/errors/TournamentError';
import { RateLimiter } from '@/lib/utils/rateLimiter';

export class TournamentOrchestrator {
  private static rateLimiter = new RateLimiter({
    maxRequests: 10,
    perSeconds: 60
  });

  /**
   * Start a tournament
   */
  static async startTournament(tournament_id: string): Promise<void> {
    try {
      // Rate limiting
      if (!await this.rateLimiter.tryAcquire(`tournament:${tournament_id}`)) {
        throw new TournamentError('Too many requests. Please try again later.');
      }

      // Get tournament data
      const tournament = await TournamentCache.getTournament(tournament_id) ||
        await TournamentService.getTournamentById(tournament_id);

      if (!tournament) {
        throw new TournamentError('Tournament not found');
      }

      // Update tournament status
      await TournamentService.updateTournamentStatus(tournament_id, 'in_progress');

      // Create initial matches
      const participants = await this.getParticipants(tournament_id);
      const matches = await this.createInitialMatches(tournament_id, participants);

      // Cache tournament data
      await TournamentCache.cacheTournament({
        ...tournament,
        status: 'in_progress'
      });

      // Send notifications
      await TournamentNotification.notifyTournamentParticipants(tournament_id, {
        type: 'tournament_start',
        title: 'Tournament Started',
        message: `The tournament "${tournament.title}" has begun!`,
        data: { tournament_id }
      });

      // Start tracking metrics
      await TournamentAnalytics.trackMetrics(tournament_id, {
        active_players: participants.length,
        matches_in_progress: matches.length,
        average_match_duration: 0,
        error_rate: 0
      });
    } catch (error) {
      console.error('Error starting tournament:', error);
      throw new TournamentError('Failed to start tournament');
    }
  }

  /**
   * Handle match completion
   */
  static async handleMatchCompletion(match_id: string): Promise<void> {
    try {
      // Get match data
      const match = await TournamentCache.getMatch(match_id) ||
        await TournamentService.getMatchById(match_id);

      if (!match) {
        throw new TournamentError('Match not found');
      }

      // Update ratings
      await TournamentMatchmaking.updateRatings(match);

      // Send notifications
      await TournamentNotification.notifyMatchResult(match);

      // Update tournament progress
      const isComplete = await this.checkTournamentCompletion(match.tournament_id);
      if (isComplete) {
        await this.completeTournament(match.tournament_id);
      } else {
        await this.progressToNextRound(match.tournament_id);
      }

      // Invalidate caches
      await TournamentCache.invalidateMatch(match_id);
      await TournamentCache.invalidateTournament(match.tournament_id);
    } catch (error) {
      console.error('Error handling match completion:', error);
      throw new TournamentError('Failed to handle match completion');
    }
  }

  /**
   * Real-time match synchronization
   */
  static async syncMatch(match_id: string, update: any): Promise<void> {
    try {
      const channel = supabase.channel(`match:${match_id}`);
      
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.send({
            type: 'broadcast',
            event: 'match_update',
            payload: update
          });
        }
      });
    } catch (error) {
      console.error('Error syncing match:', error);
      // Don't throw to prevent disrupting gameplay
    }
  }

  private static async getParticipants(tournament_id: string): Promise<Player[]> {
    const { data } = await supabase
      .from('tournament_participants')
      .select('player:players(*)')
      .eq('tournament_id', tournament_id);

    return data?.map(p => p.player) || [];
  }

  private static async createInitialMatches(tournament_id: string, participants: Player[]): Promise<TournamentMatch[]> {
    const matches: TournamentMatch[] = [];
    
    // Create matches in pairs
    for (let i = 0; i < participants.length; i += 2) {
      if (participants[i + 1]) {
        const match = await TournamentMatchmaking.createMatch(
          tournament_id,
          participants[i].id,
          participants[i + 1].id,
          1 // First round
        );
        matches.push(match);
      }
    }

    return matches;
  }

  private static async checkTournamentCompletion(tournament_id: string): Promise<boolean> {
    const { data: matches } = await supabase
      .from('tournament_matches')
      .select('status')
      .eq('tournament_id', tournament_id);

    return matches?.every(m => m.status === 'completed') || false;
  }

  private static async completeTournament(tournament_id: string): Promise<void> {
    const tournament = await TournamentService.getTournamentById(tournament_id);
    if (!tournament) return;

    // Get winner
    const { data: winner } = await supabase
      .from('tournament_participants')
      .select('user_id, score')
      .eq('tournament_id', tournament_id)
      .order('score', { ascending: false })
      .limit(1)
      .single();

    if (winner) {
      // Update tournament status
      await TournamentService.updateTournamentStatus(tournament_id, 'completed');

      // Send notifications
      await TournamentNotification.notifyTournamentEnd(tournament, winner.user_id);

      // Update analytics
      await TournamentAnalytics.trackMetrics(tournament_id, {
        active_players: 0,
        matches_in_progress: 0,
        average_match_duration: 0,
        error_rate: 0
      });
    }
  }

  private static async progressToNextRound(tournament_id: string): Promise<void> {
    try {
      // Get current round matches
      const { data: currentMatches } = await supabase
        .from('tournament_matches')
        .select('*, player1:players(*), player2:players(*)')
        .eq('tournament_id', tournament_id)
        .eq('status', 'completed');

      if (!currentMatches?.length) return;

      // Get winners from current round
      const winners = currentMatches.reduce<(Player & { score: number })[]>((acc, match) => {
        if (!match.winner_id) return acc;
        const winner = match.winner_id === match.player1.id ? match.player1 : match.player2;
        if (!winner) return acc;
        return [...acc, { ...winner, score: match.score || 0 }];
      }, []);

      if (!winners.length) return;

      // Create next round matches
      const nextRound = currentMatches[0].round + 1;
      const newMatches: TournamentMatch[] = [];

      // Pair winners for next round
      for (let i = 0; i < winners.length; i += 2) {
        const player1 = winners[i];
        const player2 = winners[i + 1];

        if (player1 && player2) {
          const match = await TournamentMatchmaking.createMatch(
            tournament_id,
            player1.id,
            player2.id,
            nextRound
          );
          newMatches.push(match);
        }
      }

      // If there's an odd number of winners, the last one gets a bye
      if (winners.length % 2 !== 0) {
        const lastWinner = winners[winners.length - 1];
        const match = await TournamentMatchmaking.createMatch(
          tournament_id,
          lastWinner.id,
          null, // Bye
          nextRound
        );
        newMatches.push(match);
      }

      // Update tournament status if needed
      if (newMatches.length === 1) {
        await TournamentService.updateTournamentStatus(tournament_id, 'final_round');
      }

      // Notify players
      for (const match of newMatches) {
        await TournamentNotification.notifyMatchCreated(match);
      }

      // Update cache
      await TournamentCache.invalidateTournament(tournament_id);
    } catch (error) {
      console.error('Error progressing to next round:', error);
      throw new TournamentError('Failed to progress to next round');
    }
  }
} 