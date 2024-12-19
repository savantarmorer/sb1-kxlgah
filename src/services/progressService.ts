import { supabase } from '../lib/supabaseClient.ts';
import { UserProgressDB, battle_statsDB } from '../types/battle';
import { LevelSystem } from '../lib/levelSystem';
import { Reward } from '../types/rewards';
import { NotificationSystem } from '../utils/notificationSystem';

/**
 * Type for progress update operations
 * Allows partial updates to user progress and related data
 */
export type ProgressUpdatePayload = {
  [K in keyof Partial<UserProgressDB>]: K extends 'battle_stats' 
    ? Partial<battle_statsDB> 
    : Partial<UserProgressDB>[K]
} & {
  battle_stats?: Partial<battle_statsDB>;
}

/**
 * Interface representing user progress data
 * Combines data from multiple tables and adds calculated fields
 */
export interface UserProgress {
  id: string;
  user_id: string;
  xp: number;
  level: number;
  coins: number;
  streak: number;
  achievements: any[];
  inventory: any[];
  battle_stats: battle_statsDB;
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
  last_battle_time: string;
  daily_battles: number;
  last_daily_reset: string;
  battle_history: Array<{
    battle_id: string;
    result: 'victory' | 'defeat';
    xp_earned: number;
    coins_earned: number;
    timestamp: string;
  }>;
  avatar_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Generates rewards for level up
 * Higher levels give better rewards
 */
const generateLevelUpRewards = (level: number): Reward[] => {
  const baseCoins = 100 * level;
  const rewards: Reward[] = [];

  // Base coin reward
  rewards.push({
    id: `level_${level}_coins`,
    type: 'coins',
    value: baseCoins,
    name: 'Level Up Coins',
    description: 'Coins earned from reaching a new level',
    amount: 1,
    rarity: level >= 50 ? 'legendary' : level >= 30 ? 'epic' : level >= 10 ? 'rare' : 'common'
  });

  // Special rewards for milestone levels
  if (level % 10 === 0) {
    rewards.push({
      id: `level_${level}_special`,
      type: 'item',
      value: 1,
      name: 'Special Level Achievement',
      description: 'A special reward for reaching a milestone level',
      amount: 1,
      rarity: level >= 50 ? 'legendary' : level >= 30 ? 'epic' : 'rare'
    });
  }

  return rewards;
};

/**
 * Service class for managing user progress
 * Handles database operations and progress calculations
 */
export class ProgressService {
  /**
   * Creates a new pending lootbox in the database
   * 
   * @param user_id - User ID to create lootbox for
   * @param type - Type of lootbox
   * @param rewards - Array of rewards in the lootbox
   * @param rarity - Rarity of the lootbox
   * @returns Promise resolving to the created lootbox
   */
  static async createPendingLootbox(
    user_id: string,
    type: 'level_up' | 'achievement' | 'daily',
    rewards: Reward[],
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
  ) {
    console.debug('[DB] Creating pending lootbox:', {
      user_id,
      type,
      rewardsCount: rewards.length,
      rarity
    });

    try {
      const { data, error } = await supabase
        .from('pending_lootboxes')
        .insert({
          user_id,
          type,
          rewards,
          rarity,
          is_claimed: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[DB] Error creating lootbox:', error);
        throw error;
      }

      console.debug('[DB] Lootbox created successfully:', data.id);
      return data;
    } catch (err) {
      console.error('[DB] Error in createPendingLootbox:', err);
      throw err;
    }
  }

  /**
   * Retrieves user progress data from database
   * Includes battle stats
   * 
   * @param user_id - User ID to fetch progress for
   * @returns Promise resolving to user progress data
   */
  static async get_progress(user_id: string): Promise<UserProgress | null> {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*, battle_stats(*)')
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
   * Handles updates to multiple tables (progress, stats)
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
        .select('*, battle_stats(*)')
        .eq('user_id', user_id)
        .single();

      // Calculate new level and streak multiplier if XP is being updated
      if (progress.xp !== undefined && existing_progress) {
        const new_level = LevelSystem.calculate_level(progress.xp);
        
        // Update level if changed and generate rewards
        if (new_level !== existing_progress.level) {
          const level_up_rewards = generateLevelUpRewards(new_level);
          const rarity = new_level >= 50 ? 'legendary' : new_level >= 30 ? 'epic' : new_level >= 10 ? 'rare' : 'common';
          
          // Create a pending lootbox for the level up rewards
          const lootbox = await this.createPendingLootbox(
            user_id,
            'level_up',
            level_up_rewards,
            rarity
          );

          // Show level up notification with lootbox option
          NotificationSystem.showLevelUp({
            level: new_level,
            rewards: level_up_rewards,
            lootbox_id: lootbox.id,
            onOpen: () => {
              // This will be handled by the UI component
              window.dispatchEvent(new CustomEvent('SHOW_LOOTBOX', {
                detail: {
                  lootbox_id: lootbox.id,
                  rewards: level_up_rewards,
                  type: 'level_up',
                  rarity,
                  level: new_level
                }
              }));
            },
            onSave: () => {
              NotificationSystem.showSuccess('Lootbox saved to inventory!');
            }
          });

          progress = {
            ...progress,
            level: new_level
          };
        }
      }

      // Update streak multiplier if streak is being modified
      if (progress.streak !== undefined) {
        const new_streak_multiplier = LevelSystem.update_streak_multiplier(progress.streak);
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

      // Remove battle_stats from the progress object before updating user_progress
      const { battle_stats, ...progress_without_related } = progress;

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
        .select('*, battle_stats(*)')
        .single();

      if (progress_error) {
        console.error('Error updating user progress:', progress_error);
        throw progress_error;
      }

      return updated_progress as UserProgress;
    } catch (err) {
      console.error('Error in update_progress:', err);
      throw err;
    }
  }

  /**
   * Get all pending lootboxes for a user
   * 
   * @param user_id - User ID to get lootboxes for
   * @returns Promise resolving to array of pending lootboxes
   */
  static async getPendingLootboxes(user_id: string) {
    try {
      const { data, error } = await supabase
        .from('pending_lootboxes')
        .select('*')
        .eq('user_id', user_id)
        .eq('is_claimed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching pending lootboxes:', err);
      throw err;
    }
  }

  /**
   * FUNÇÃO PARA CHAMAR UMA LOOTBOX PENDENTE
   * 
   * @param user_id - User ID claiming the lootbox
   * @param lootbox_id - ID of the lootbox to claim
   * @returns Promise resolving to the claimed lootbox
   */
  static async claimLootbox(user_id: string, lootbox_id: string) {
    console.debug('[DB] Claiming lootbox:', { user_id, lootbox_id });

    try {
      const { data: lootbox, error: fetchError } = await supabase
        .from('pending_lootboxes')
        .select('*')
        .eq('id', lootbox_id)
        .eq('user_id', user_id)
        .eq('is_claimed', false)
        .single();

      if (fetchError) {
        console.error('[DB] Error fetching lootbox:', fetchError);
        throw fetchError;
      }
      if (!lootbox) {
        console.error('[DB] Lootbox not found or already claimed');
        throw new Error('Lootbox not found or already claimed');
      }

      console.debug('[DB] Found lootbox:', lootbox);

      // Mark lootbox as claimed
      const { data: updatedLootbox, error: updateError } = await supabase
        .from('pending_lootboxes')
        .update({
          is_claimed: true,
          claimed_at: new Date().toISOString()
        })
        .eq('id', lootbox_id)
        .select()
        .single();

      if (updateError) {
        console.error('[DB] Error updating lootbox:', updateError);
        throw updateError;
      }

      console.debug('[DB] Lootbox claimed successfully');
      return updatedLootbox;
    } catch (err) {
      console.error('[DB] Error in claimLootbox:', err);
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
      const new_level = LevelSystem.calculate_level(new_xp);
      const new_streak = battle_result.is_victory 
        ? (current_progress.streak || 0) + 1 
        : 0;
      const new_streak_multiplier = LevelSystem.update_streak_multiplier(new_streak);

      const progress_update: ProgressUpdatePayload = {
        xp: new_xp,
        level: new_level,
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
