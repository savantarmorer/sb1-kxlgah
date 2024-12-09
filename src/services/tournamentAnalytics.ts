import { supabase } from '@/lib/supabase';
import { Tournament, TournamentMatch, Player } from '@/types/tournament';
import { TournamentError } from '@/errors/TournamentError';

interface TournamentStats {
  total_matches: number;
  completed_matches: number;
  active_players: number;
  average_score: number;
  completion_rate: number;
}

interface PlayerStats {
  matches_played: number;
  wins: number;
  losses: number;
  average_score: number;
  total_rewards: {
    xp: number;
    coins: number;
  };
}

export class TournamentAnalytics {
  /**
   * Get tournament statistics
   */
  static async getTournamentStats(tournament_id: string): Promise<TournamentStats> {
    try {
      const { data: matches } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournament_id);

      const { data: participants } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournament_id);

      if (!matches || !participants) {
        throw new TournamentError('Failed to fetch tournament data');
      }

      const totalMatches = matches.length;
      const completedMatches = matches.filter(m => m.status === 'completed').length;
      const activePlayers = participants.length;
      const averageScore = matches.reduce((acc, m) => acc + (m.score || 0), 0) / totalMatches;
      const completionRate = (completedMatches / totalMatches) * 100;

      return {
        total_matches: totalMatches,
        completed_matches: completedMatches,
        active_players: activePlayers,
        average_score: Math.round(averageScore),
        completion_rate: Math.round(completionRate)
      };
    } catch (error) {
      console.error('Error getting tournament stats:', error);
      throw new TournamentError('Failed to get tournament statistics');
    }
  }

  /**
   * Get player statistics for a tournament
   */
  static async getPlayerStats(tournament_id: string, player_id: string): Promise<PlayerStats> {
    try {
      const { data: matches } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournament_id)
        .or(`player1_id.eq.${player_id},player2_id.eq.${player_id}`);

      if (!matches) {
        throw new TournamentError('Failed to fetch player matches');
      }

      const wins = matches.filter(m => m.winner_id === player_id).length;
      const matchesPlayed = matches.length;
      const playerScores = matches.map(m => {
        if (m.player1_id === player_id) return m.player1_score || 0;
        return m.player2_score || 0;
      });
      const averageScore = playerScores.reduce((a, b) => a + b, 0) / matchesPlayed;

      const { data: rewards } = await supabase
        .from('tournament_rewards')
        .select('xp, coins')
        .eq('tournament_id', tournament_id)
        .eq('player_id', player_id)
        .single();

      return {
        matches_played: matchesPlayed,
        wins,
        losses: matchesPlayed - wins,
        average_score: Math.round(averageScore),
        total_rewards: {
          xp: rewards?.xp || 0,
          coins: rewards?.coins || 0
        }
      };
    } catch (error) {
      console.error('Error getting player stats:', error);
      throw new TournamentError('Failed to get player statistics');
    }
  }

  /**
   * Get tournament leaderboard
   */
  static async getLeaderboard(tournament_id: string): Promise<Player[]> {
    try {
      const { data: participants } = await supabase
        .from('tournament_participants')
        .select(`
          player:players(*),
          score,
          matches_played
        `)
        .eq('tournament_id', tournament_id)
        .order('score', { ascending: false })
        .limit(100);

      return participants?.map(p => ({
        ...p.player,
        score: p.score,
        matches_played: p.matches_played
      })) || [];
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw new TournamentError('Failed to get tournament leaderboard');
    }
  }

  /**
   * Track tournament metrics
   */
  static async trackMetrics(tournament_id: string, metrics: {
    active_players: number;
    matches_in_progress: number;
    average_match_duration: number;
    error_rate: number;
  }): Promise<void> {
    try {
      await supabase
        .from('tournament_metrics')
        .insert({
          tournament_id,
          timestamp: new Date().toISOString(),
          ...metrics
        });
    } catch (error) {
      console.error('Error tracking metrics:', error);
      // Don't throw here to prevent disrupting the main flow
    }
  }
} 