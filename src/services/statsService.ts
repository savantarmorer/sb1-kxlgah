import { supabase } from '../lib/supabaseClient.ts.old';
import type { GameDispatch } from '../contexts/GameContext';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface StatsUpdate {
  table: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  record: any;
  old_record: any;
}

/**
 * Convert Supabase realtime payload to StatsUpdate type
 */
function mapToStatsUpdate(payload: RealtimePostgresChangesPayload<{ [key: string]: any }>): StatsUpdate {
  return {
    table: payload.table,
    type: payload.eventType.toUpperCase() as 'INSERT' | 'UPDATE' | 'DELETE',
    record: payload.new,
    old_record: payload.old
  };
}

/**
 * StatsService
 * Manages real-time statistics updates via Supabase subscriptions
 * 
 * Monitors:
 * - user_progress: Core progress updates
 * - battle_stats: Combat performance
 * - quiz_user_stats: Quiz performance
 * - user_achievements: Achievement unlocks
 * - user_logins: Login streaks
 */
export class StatsService {
  private subscriptions: { [key: string]: any } = {};
  private dispatch: GameDispatch;
  private userId: string;

  constructor(dispatch: GameDispatch, userId: string) {
    this.dispatch = dispatch;
    this.userId = userId;
  }

  /**
   * Initialize all real-time subscriptions
   */
  async initializeSubscriptions() {
    // User Progress Updates
    this.subscriptions.progress = supabase
      .channel('user_progress_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => this.handleProgressUpdate(mapToStatsUpdate(payload))
      )
      .subscribe();

    // Battle Stats Updates
    this.subscriptions.battles = supabase
      .channel('battle_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_stats',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => this.handleBattleUpdate(mapToStatsUpdate(payload))
      )
      .subscribe();

    // Quiz Stats Updates
    this.subscriptions.quiz = supabase
      .channel('quiz_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_user_stats',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => this.handleQuizUpdate(mapToStatsUpdate(payload))
      )
      .subscribe();

    // Achievement Updates
    this.subscriptions.achievements = supabase
      .channel('achievement_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => this.handleAchievementUpdate(mapToStatsUpdate(payload))
      )
      .subscribe();

    // Login Streak Updates
    this.subscriptions.logins = supabase
      .channel('login_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_logins',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => this.handleLoginUpdate(mapToStatsUpdate(payload))
      )
      .subscribe();
  }

  /**
   * Clean up subscriptions
   */
  cleanup() {
    Object.values(this.subscriptions).forEach(subscription => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    });
  }

  /**
   * Handle progress updates
   */
  private handleProgressUpdate(payload: StatsUpdate) {
    const { type, record } = payload;
    if (type === 'UPDATE') {
      this.dispatch({
        type: 'UPDATE_USER_PROGRESS',
        payload: {
          id: record.id,
          user_id: record.user_id,
          xp: record.xp,
          level: record.level,
          xp_progress: record.xp_progress,
          coins: record.coins,
          streak: record.streak,
          achievements: record.achievements,
          inventory: record.inventory,
          battle_stats: record.battle_stats,
          reward_multipliers: record.reward_multipliers,
          streak_multiplier: record.streak_multiplier,
          recent_xp_gains: record.recent_xp_gains,
          last_battle_time: record.last_battle_time,
          daily_battles: record.daily_battles,
          last_daily_reset: record.last_daily_reset,
          battle_history: record.battle_history,
          created_at: record.created_at,
          updated_at: record.updated_at,
          avatar: record.avatar,
          avatarFrame: record.avatarFrame
        }
      });
    }
  }

  /**
   * Handle battle stat updates
   */
  private handleBattleUpdate(payload: StatsUpdate) {
    const { type, record } = payload;
    if (type === 'UPDATE') {
      this.dispatch({
        type: 'UPDATE_BATTLE_STATS',
        payload: {
          user_id: record.user_id,
          total_battles: record.total_battles,
          wins: record.wins,
          losses: record.losses,
          win_streak: record.win_streak,
          highest_streak: record.highest_streak,
          total_xp_earned: record.total_xp_earned,
          total_coins_earned: record.total_coins_earned,
          tournaments_played: record.tournaments_played || 0,
          tournaments_won: record.tournaments_won || 0,
          tournament_matches_played: record.tournament_matches_played || 0,
          tournament_matches_won: record.tournament_matches_won || 0,
          rating: record.rating || 1000,
          rank: record.rank || 'novice'
        }
      });
    }
  }

  /**
   * Handle quiz stat updates
   */
  private handleQuizUpdate(payload: StatsUpdate) {
    const { type, record } = payload;
    if (type === 'UPDATE') {
      this.dispatch({
        type: 'UPDATE_QUIZ_STATS',
        payload: {
          total_questions: record.total_questions,
          correct_answers: record.correct_answers,
          average_time: record.average_time,
          streak: record.streak,
          last_quiz_date: record.last_quiz_date
        }
      });
    }
  }

  /**
   * Handle achievement updates
   */
  private handleAchievementUpdate(payload: StatsUpdate) {
    const { type, record } = payload;
    if (type === 'INSERT') {
      this.dispatch({
        type: 'ADD_ACHIEVEMENT',
        payload: {
          id: record.achievement_id,
          title: record.title || '',
          description: record.description || '',
          category: record.category || 'general',
          points: record.points || 0,
          unlocked_at: record.unlocked_at,
          progress: record.progress,
          rarity: record.rarity || 'common',
          icon: record.icon || '',
          metadata: record.metadata || {},
          unlocked: record.unlocked || false,
          prerequisites: record.prerequisites || [],
          dependents: record.dependents || [],
          trigger_conditions: record.trigger_conditions || [],
          order_num: record.order || 0
        }
      });
    } else if (type === 'UPDATE') {
      this.dispatch({
        type: 'UPDATE_ACHIEVEMENT',
        payload: {
          id: record.achievement_id,
          progress: record.progress
        }
      });
    }
  }

  /**
   * Handle login streak updates
   */
  private handleLoginUpdate(payload: StatsUpdate) {
    const { type, record } = payload;
    if (type === 'INSERT' || type === 'UPDATE') {
      this.dispatch({
        type: 'UPDATE_LOGIN_STREAK',
        payload: {
          streak: record.streak_maintained ? (record.streak || 0) + 1 : 0,
          last_login_date: record.login_date
        }
      });
    }
  }
}
