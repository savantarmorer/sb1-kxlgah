import { supabase } from '../lib/supabaseClient';
import { UserProgressDB, battle_statsDB, BattleRatingsDB } from '../types/battle';
import { calculate_level, calculate_xp_progress, update_streak_multiplier } from '../utils/gameUtils';

/**
 * Type for progress update operations
 * Allows partial updates to user progress and related data
 */
export type ProgressUpdatePayload = {
  [K in keyof Partial<UserProgressDB>]: K extends 'battle_stats' 
    ? Partial<battle_statsDB> 
    : K extends 'battle_ratings' 
      ? Partial<BattleRatingsDB>
      : Partial<UserProgressDB>[K]
} & {
  battle_stats?: Partial<battle_statsDB>;
  battle_ratings?: Partial<BattleRatingsDB>;
}

/**
 * Interface representing user progress data
 * Combines data from multiple tables and adds calculated fields
 */
export interface UserProgress {
  user_id: string;
  xp: number;
  level: number;
  coins: number;
  streak: number;
  battle_stats: battle_statsDB;
  battle_ratings: BattleRatingsDB;
  reward_multipliers: {
    xp: number;
    coins: number;
  };
  streak_multiplier: number;
  recent_xp_gains: Array<{
    amount: number;
    source: string;
    timestamp: string;
  }>;
  battle_history: Array<{
    battle_id: string;
    result: 'victory' | 'defeat';
    xp_earned: number;
    coins_earned: number;
    timestamp: string;
  }>;
  created_at: string;
  updated_at: string;
  xp_progress: number;
}

/**
 * Service class for managing user progress
 * Handles database operations and progress calculations
 * 
 * Dependencies:
 * - Supabase client for database operations
 * - gameUtils for level and streak calculations
 * - battle types for database schemas
 * 
 * Used by:
 * - GameContext for state management
 * - Battle system for updating progress
 * - Achievement system for tracking progress
 */
export class ProgressService {
  /**
   * Retrieves user progress data from database
   * Includes battle stats and ratings
   * 
   * @param user_id - User ID to fetch progress for
   * @returns Promise resolving to user progress data
   */
  static async get_progress(user_id: string): Promise<UserProgress | null> {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*, battle_stats(*), battle_ratings(*)')
        .eq('user_id', user_id)
        .single();

      if (error) {
        console.error('Error fetching progress:', error);
        return null;
      }

      return data as UserProgress;
    } catch (err) {
      console.error('Error in get_progress:', err);
      return null;
    }
  }

  /**
   * Updates user progress in database
   * Handles updates to multiple tables (progress, stats, ratings)
   * 
   * @param user_id - User ID to update progress for
   * @param progress - Progress data to update
   * @returns Promise resolving to updated progress data
   * @throws Error if database operations fail
   */
  static async update_progress(user_id: string, progress: ProgressUpdatePayload): Promise<UserProgress | null> {
    try {
      // Start a Supabase transaction
      const { data: existing_progress } = await supabase
        .from('user_progress')
        .select('*, battle_stats(*), battle_ratings(*)')
        .eq('user_id', user_id)
        .single();

      // Calculate new level and streak multiplier if XP is being updated
      if (progress.xp !== undefined && existing_progress) {
        const new_level = calculate_level(progress.xp);
        const xp_progress = calculate_xp_progress(progress.xp, new_level);
        
        // Update level and xp progress if changed
        if (new_level !== existing_progress.level || xp_progress !== existing_progress.xp_progress) {
          progress = {
            ...progress,
            level: new_level,
            xp_progress
          };
        }
      }

      // Update streak multiplier if streak is being modified
      if (progress.streak !== undefined) {
        const new_streak_multiplier = update_streak_multiplier(progress.streak);
        progress = {
          ...progress,
          streak_multiplier: new_streak_multiplier
        };
      }

      // First update battle_stats if needed
      if (progress.battle_stats) {
        const battle_stats_update = {
          user_id,
          ...progress.battle_stats,
          updated_at: new Date().toISOString()
        };

        const { error: stats_error } = await supabase
          .from('battle_stats')
          .upsert(battle_stats_update, {
            onConflict: 'user_id'
          })
          .select();

        if (stats_error) {
          console.error('Error updating battle stats:', stats_error);
          throw stats_error;
        }
      }

      // Update battle ratings separately if needed
      if (progress.battle_ratings) {
        const battle_ratings_update = {
          user_id,
          ...progress.battle_ratings,
          updated_at: new Date().toISOString()
        };

        const { error: rating_error } = await supabase
          .from('battle_ratings')
          .upsert(battle_ratings_update, {
            onConflict: 'user_id'
          })
          .select();

        if (rating_error) {
          console.error('Error updating battle ratings:', rating_error);
          throw rating_error;
        }
      }

      // Remove battle_ratings and battle_stats from the progress object before updating user_progress
      const { battle_ratings, battle_stats, ...progress_without_related } = progress;

      // Update main progress record
      const { data: updated_progress, error: progress_error } = await supabase
        .from('user_progress')
        .upsert({
          user_id,
          ...(existing_progress || {}),
          ...progress_without_related,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select('*, battle_stats(*), battle_ratings(*)');

      if (progress_error) {
        console.error('Error updating user progress:', progress_error);
        throw progress_error;
      }

      return updated_progress?.[0] as UserProgress;
    } catch (err) {
      console.error('Error in update_progress:', err);
      throw err;
    }
  }

  /**
   * Calculate and update user progress after a battle
   * Updates XP, level, streak, and related statistics
   * 
   * @param user_id - User ID to update progress for
   * @param battle_result - Battle outcome and rewards
   * @returns Promise resolving to updated progress data
   */
  static async update_battle_progress(
    user_id: string,
    battle_result: {
      is_victory: boolean;
      xp_earned: number;
      coins_earned: number;
      streak_bonus?: number;
    }
  ): Promise<UserProgress | null> {
    try {
      const { data: current_progress } = await supabase
        .from('user_progress')
        .select('*, battle_stats(*)')
        .eq('user_id', user_id)
        .single();

      if (!current_progress) {
        throw new Error('User progress not found');
      }

      const new_xp = (current_progress.xp || 0) + battle_result.xp_earned;
      const new_level = calculate_level(new_xp);
      const new_xp_progress = calculate_xp_progress(new_xp, new_level);
      const new_streak = battle_result.is_victory 
        ? (current_progress.streak || 0) + 1 
        : 0;
      const new_streak_multiplier = update_streak_multiplier(new_streak);

      const progress_update: ProgressUpdatePayload = {
        xp: new_xp,
        level: new_level,
        xp_progress: new_xp_progress,
        coins: (current_progress.coins || 0) + battle_result.coins_earned,
        streak: new_streak,
        streak_multiplier: new_streak_multiplier,
        battle_stats: {
          total_battles: (current_progress.battle_stats?.total_battles || 0) + 1,
          wins: battle_result.is_victory 
            ? (current_progress.battle_stats?.wins || 0) + 1 
            : (current_progress.battle_stats?.wins || 0),
          losses: !battle_result.is_victory 
            ? (current_progress.battle_stats?.losses || 0) + 1 
            : (current_progress.battle_stats?.losses || 0),
          win_streak: battle_result.is_victory 
            ? (current_progress.battle_stats?.win_streak || 0) + 1 
            : 0,
          highest_streak: battle_result.is_victory 
            ? Math.max(
                (current_progress.battle_stats?.highest_streak || 0),
                (current_progress.battle_stats?.win_streak || 0) + 1
              ) 
            : (current_progress.battle_stats?.highest_streak || 0),
          total_xp_earned: (current_progress.battle_stats?.total_xp_earned || 0) + battle_result.xp_earned,
          total_coins_earned: (current_progress.battle_stats?.total_coins_earned || 0) + battle_result.coins_earned
        }
      };

      return this.update_progress(user_id, progress_update);
    } catch (err) {
      console.error('Error updating battle progress:', err);
      throw err;
    }
  }

  /**
   * Updates battle rating for a user
   * Separate method for atomic rating updates
   * 
   * @param user_id - User ID to update rating for
   * @param new_rating - New rating value
   * @throws Error if update fails
   */
  static async update_battle_rating(user_id: string, new_rating: number) {
    try {
      const { error } = await supabase
        .from('battle_ratings')
        .upsert({
          user_id: user_id,
          rating: new_rating,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error updating battle rating:', err);
      throw err;
    }
  }

  /**
   * Retrieves battle history for a user
   * 
   * @param user_id - User ID to get history for
   * @param limit - Maximum number of records to return
   * @returns Promise resolving to battle history array
   */
  static async get_battle_history(user_id: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('battle_history')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching battle history:', err);
      throw err;
    }
  }
}
