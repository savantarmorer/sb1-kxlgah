import { supabase } from '@/lib/supabase';
import { Tournament, Player, TournamentMatch } from '@/types/tournament';
import { TournamentError } from '@/errors/TournamentError';

interface MatchmakingCriteria {
  level_range: number;
  rating_range: number;
  max_wait_time: number;
}

export class TournamentMatchmaking {
  private static readonly DEFAULT_CRITERIA: MatchmakingCriteria = {
    level_range: 5,
    rating_range: 200,
    max_wait_time: 60 // seconds
  };

  /**
   * Find suitable opponents for a tournament match
   */
  static async findOpponents(tournament_id: string, player_id: string): Promise<Player[]> {
    try {
      // Get tournament details
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournament_id)
        .single();

      if (!tournament) {
        throw new TournamentError('Tournament not found');
      }

      // Get player details
      const { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('id', player_id)
        .single();

      if (!player) {
        throw new TournamentError('Player not found');
      }

      // Find suitable opponents
      const { data: opponents } = await supabase
        .from('tournament_participants')
        .select(`
          player:players(*)
        `)
        .eq('tournament_id', tournament_id)
        .neq('user_id', player_id)
        .gte('player.level', player.level - this.DEFAULT_CRITERIA.level_range)
        .lte('player.level', player.level + this.DEFAULT_CRITERIA.level_range)
        .gte('player.rating', player.rating - this.DEFAULT_CRITERIA.rating_range)
        .lte('player.rating', player.rating + this.DEFAULT_CRITERIA.rating_range)
        .limit(10);

      return opponents?.map(o => o.player) || [];
    } catch (error) {
      console.error('Error finding opponents:', error);
      throw new TournamentError('Failed to find opponents');
    }
  }

  /**
   * Create a match between two players
   */
  static async createMatch(
    tournament_id: string,
    player1_id: string,
    player2_id: string,
    round: number
  ): Promise<TournamentMatch> {
    try {
      const { data, error } = await supabase
        .from('tournament_matches')
        .insert({
          tournament_id,
          player1_id,
          player2_id,
          round,
          status: 'ready'
        })
        .select(`
          *,
          player1:players!player1_id(*),
          player2:players!player2_id(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating match:', error);
      throw new TournamentError('Failed to create match');
    }
  }

  /**
   * Update player ratings after a match
   */
  static async updateRatings(match: TournamentMatch): Promise<void> {
    if (!match.winner_id) return;

    const winner = match.winner_id === match.player1.id ? match.player1 : match.player2;
    const loser = match.winner_id === match.player1.id ? match.player2 : match.player1;

    const K_FACTOR = 32;
    const expectedWinner = 1 / (1 + Math.pow(10, (loser.rating - winner.rating) / 400));
    const expectedLoser = 1 - expectedWinner;

    const winnerRating = Math.round(winner.rating + K_FACTOR * (1 - expectedWinner));
    const loserRating = Math.round(loser.rating + K_FACTOR * (0 - expectedLoser));

    await Promise.all([
      supabase
        .from('players')
        .update({ rating: winnerRating })
        .eq('id', winner.id),
      supabase
        .from('players')
        .update({ rating: loserRating })
        .eq('id', loser.id)
    ]);
  }

  static generateInitialPairings(participants: TournamentParticipant[]): Partial<TournamentMatch>[] {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const matches: Partial<TournamentMatch>[] = [];

    for (let i = 0; i < shuffled.length; i += 2) {
      if (shuffled[i + 1]) {
        matches.push({
          tournament_id: shuffled[i].tournament_id,
          round_number: 1,
          player1_id: shuffled[i].user_id,
          player2_id: shuffled[i + 1].user_id,
          status: 'waiting'
        });
      }
    }

    return matches;
  }

  static generateNextRoundPairings(winners: Player[], nextRound: number): Partial<TournamentMatch>[] {
    const matches: Partial<TournamentMatch>[] = [];

    for (let i = 0; i < winners.length; i += 2) {
      if (winners[i + 1]) {
        matches.push({
          tournament_id: winners[i].tournament_id,
          round_number: nextRound,
          player1_id: winners[i].id,
          player2_id: winners[i + 1].id,
          status: 'waiting',
          player1_score: 0,
          player2_score: 0
        });
      }
    }

    return matches;
  }

  /**
   * Create initial matches for a tournament
   */
  static async createInitialMatches(tournament_id: string): Promise<void> {
    try {
      // Get tournament participants
      const { data: participants } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournament_id);

      if (!participants?.length) {
        throw new TournamentError('Not enough participants');
      }

      // Shuffle participants to randomize matchups
      const shuffled = [...participants].sort(() => Math.random() - 0.5);

      // Create matches in pairs
      const matches = [];
      for (let i = 0; i < shuffled.length; i += 2) {
        if (shuffled[i + 1]) {
          matches.push({
            tournament_id,
            round: 1,
            player1_id: shuffled[i].user_id,
            player2_id: shuffled[i + 1].user_id,
            status: 'pending',
            created_at: new Date().toISOString()
          });
        } else {
          // If odd number of players, give last player a bye
          matches.push({
            tournament_id,
            round: 1,
            player1_id: shuffled[i].user_id,
            player2_id: null, // Bye
            status: 'pending',
            created_at: new Date().toISOString()
          });
        }
      }

      // Insert matches into database
      const { error } = await supabase
        .from('tournament_matches')
        .insert(matches);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating initial matches:', error);
      throw new TournamentError('Failed to create initial matches');
    }
  }
} 