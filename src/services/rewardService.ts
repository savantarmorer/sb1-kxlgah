import { supabase } from '../lib/supabase';
import { BattleResults } from '../types/battle';
import { Reward } from '../types/rewards';
import { Quest } from '../types/quests';
import { QuestProgressUpdate as QuestProgress } from '../types/quests';
import { BATTLE_ACHIEVEMENTS } from '../config/achievements';
import { BATTLE_CONFIG } from '../config/battleConfig';

/**
 * RewardService handles reward calculations for quests, battles, and achievements
 * 
 * Dependencies:
 * - BattleResults type for battle rewards
 * - Quest type for quest rewards
 * - Achievement type for achievement rewards
 * 
 * Integration Points:
 * - GameContext: Updates game state with rewards
 * - ProgressService: Updates user progress
 * - AchievementSystem: Processes achievements
 */
export class RewardService {
  /**
   * Calculates rewards based on type (quest, battle, or achievement)
   * 
   * @param params - Parameters containing type and data
   * @returns Array of calculated rewards
   * 
   * Dependencies:
   * - BattleResults type for battle rewards
   * - Quest type for quest rewards
   * - Achievement type for achievement rewards
   * 
   * Integration Points:
   * - GameContext: Updates game state with rewards
   * - ProgressService: Updates user progress
   * - AchievementSystem: Processes achievements
   */
  static calculate_rewards(params: {
    type: 'quest' | 'battle' | 'achievement';
    data: any;
  }): Reward[] {
    switch (params.type) {
      case 'quest':
        return this.calculate_quest_rewards(params.data);
      case 'battle':
        return this.calculate_battle_rewards(params.data).rewards;
      case 'achievement':
        return this.calculate_achievement_rewards(params.data);
      default:
        return [];
    }
  }

  /**
   * Calculates quest rewards based on quest data
   * 
   * @param quest - Quest data containing xp and coin rewards
   * @returns Array of calculated rewards
   */
  private static calculate_quest_rewards(quest: Quest): Reward[] {
    const rewards: Reward[] = [];
    
    if (quest.xp_reward > 0) {
      rewards.push({
        id: `quest_${quest.id}_xp`,
        type: 'xp',
        value: Number(quest.xp_reward),
        rarity: 'common',
        name: 'Quest XP Reward',
        description: 'XP earned from completing quest',
        amount: 1,
        metadata: {
          source: 'quest_completion',
          quest_id: quest.id || ''
        }
      });
    }

    if (quest.coin_reward > 0) {
      rewards.push({
        id: `quest_${quest.id}_coins`,
        type: 'coins',
        value: Number(quest.coin_reward),
        rarity: 'common',
        name: 'Quest Coins Reward',
        description: 'Coins earned from completing quest',
        amount: 1,
        metadata: {
          source: 'quest_completion',
          quest_id: quest.id || ''
        }
      });
    }

    return rewards;
  }

  /**
   * Calculate battle rewards based on performance
   */
  static calculate_battle_rewards(
    battle_state: BattleResults
  ): {
    rewards: Reward[];
    achievements: string[];
    quest_updates: QuestProgress[];
    summary: {
      total_xp: number;
      total_coins: number;
      achievements_unlocked: number;
      quests_updated: number;
    };
    battle_rewards: {
      xp_earned: number;
      coins_earned: number;
      streak_bonus: number;
      is_victory: boolean;
      player_score: number;
      opponent_score: number;
      created_at: string;
    };
  } {
    const {
      player_score,
      opponent_score,
      time_bonus = 0,
      streak = 0,
      is_victory
    } = battle_state;

    // Calculate score ratio (percentage of max possible score)
    const score_ratio = player_score / (player_score + opponent_score) || 0;

    // Calculate base rewards using config values
    const base_xp = Math.round(BATTLE_CONFIG.progress.base_xp * score_ratio);
    const base_coins = Math.round(BATTLE_CONFIG.progress.base_coins * score_ratio);

    // Calculate rewards with victory bonus
    let xp_earned = base_xp;
    let coins_earned = base_coins;
    
    if (is_victory) {
      xp_earned = Math.round(base_xp * BATTLE_CONFIG.rewards.victory_bonus.xp_multiplier);
      coins_earned = Math.round(base_coins * BATTLE_CONFIG.rewards.victory_bonus.coins_multiplier);
    }

    // Apply streak bonus
    const streak_bonus = Math.min(
      Math.floor(xp_earned * BATTLE_CONFIG.rewards.streak_bonus.multiplier * streak),
      BATTLE_CONFIG.rewards.streak_bonus.max_bonus
    );

    // Apply time bonus if present
    let time_bonus_amount = 0;
    if (time_bonus > 0) {
      time_bonus_amount = Math.min(
        Math.floor(xp_earned * BATTLE_CONFIG.rewards.time_bonus.multiplier * time_bonus),
        BATTLE_CONFIG.rewards.time_bonus.max_bonus
      );
      xp_earned += time_bonus_amount;
    }

    // Return rewards in format matching database schema
    const battle_rewards = {
      xp_earned,
      coins_earned,
      streak_bonus,
      is_victory,
      player_score,
      opponent_score,
      created_at: new Date().toISOString()
    };

    const rewards: Reward[] = [
      {
        id: `battle_base_xp_${Date.now()}`,
        type: 'xp',
        value: xp_earned,
        rarity: is_victory ? 'rare' : 'common',
        name: 'Battle XP',
        description: 'XP earned from battle',
        amount: 1,
        metadata: {
          source: 'battle_base',
          is_victory,
          streak
        }
      },
      {
        id: `battle_base_coins_${Date.now()}`,
        type: 'coins',
        value: coins_earned,
        rarity: is_victory ? 'rare' : 'common',
        name: 'Battle Coins',
        description: 'Coins earned from battle',
        amount: 1,
        metadata: {
          source: 'battle_base',
          is_victory,
          streak
        }
      }
    ];

    // Add streak bonus reward if applicable
    if (streak_bonus > 0) {
      rewards.push({
        id: `battle_streak_bonus_${Date.now()}`,
        type: 'xp',
        value: streak_bonus,
        rarity: 'rare',
        name: 'Streak Bonus XP',
        description: 'Bonus XP from maintaining streak',
        amount: 1,
        metadata: {
          source: 'battle_streak',
          streak
        }
      });
    }

    // Add time bonus reward if applicable
    if (time_bonus_amount > 0) {
      rewards.push({
        id: `battle_time_bonus_${Date.now()}`,
        type: 'xp',
        value: time_bonus_amount,
        rarity: 'epic',
        name: 'Time Bonus XP',
        description: 'Bonus XP from quick completion',
        amount: 1,
        metadata: {
          source: 'battle_time',
          time_bonus
        }
      });
    }

    const achievements: string[] = [];
    const quest_updates: QuestProgress[] = [];

    // Achievement checks
    if (score_ratio >= 0.9) {
      achievements.push('BATTLE_MASTER');
    }
    if (is_victory && streak >= 3) {
      achievements.push('BATTLE_STREAK');
    }
    if (time_bonus_amount >= BATTLE_CONFIG.rewards.time_bonus.max_bonus) {
      achievements.push('SPEED_DEMON');
    }

    // Quest updates
    if (is_victory) {
      const daily_battle_quest: QuestProgress = {
        quest_id: 'daily_battle',
        progress: 1,
        xp_reward: BATTLE_CONFIG.progress.base_xp,
        coin_reward: BATTLE_CONFIG.progress.base_coins,
        timestamp: new Date().toISOString(),
        metadata: {
          score: player_score,
          time_bonus: time_bonus > 0,
          streak
        }
      };

      quest_updates.push(daily_battle_quest);

      // Update win streak quest if victory
      const streak_quest: QuestProgress = {
        quest_id: 'win_streak',
        progress: streak,
        xp_reward: BATTLE_CONFIG.progress.base_xp * Math.min(streak, 5),
        coin_reward: BATTLE_CONFIG.progress.base_coins * Math.min(streak, 5),
        timestamp: new Date().toISOString(),
        metadata: {
          score: player_score,
          time_bonus: time_bonus > 0,
          streak
        }
      };
      quest_updates.push(streak_quest);
    }

    // Calculate totals for summary
    const total_xp = rewards
      .filter(r => r.type === 'xp')
      .reduce((sum, r) => sum + (typeof r.value === 'number' ? r.value : 0), 0) +
      quest_updates.reduce((sum, q) => sum + (q.xp_reward || 0), 0);

    const total_coins = rewards
      .filter(r => r.type === 'coins')
      .reduce((sum, r) => sum + (typeof r.value === 'number' ? r.value : 0), 0) +
      quest_updates.reduce((sum, q) => sum + (q.coin_reward || 0), 0);

    return {
      rewards,
      achievements,
      quest_updates,
      summary: {
        total_xp,
        total_coins,
        achievements_unlocked: achievements.length,
        quests_updated: quest_updates.length
      },
      battle_rewards
    };
  }

  /**
   * Update database with battle rewards
   */
  static async updateBattleRewards(
    user_id: string,
    battle_rewards: {
      xp_earned: number;
      coins_earned: number;
      streak_bonus: number;
      is_victory: boolean;
      player_score: number;
      opponent_score: number;
      created_at: string;
    }
  ): Promise<void> {
    try {
      // Update battle history
      const { error: historyError } = await supabase
        .from('battle_history')
        .insert({
          user_id,
          opponent_id: null, // Set if opponent exists
          winner_id: battle_rewards.is_victory ? user_id : null,
          score_player: battle_rewards.player_score,
          score_opponent: battle_rewards.opponent_score,
          xp_earned: battle_rewards.xp_earned,
          coins_earned: battle_rewards.coins_earned,
          streak_bonus: battle_rewards.streak_bonus,
          created_at: battle_rewards.created_at,
          is_bot_opponent: true // Set based on opponent type
        });

      if (historyError) throw historyError;

      // Update battle stats
      const { data: existingStats } = await supabase
        .from('battle_stats')
        .select('*')
        .eq('user_id', user_id)
        .single();

      const statsUpdate = {
        user_id,
        total_battles: (existingStats?.total_battles || 0) + 1,
        wins: existingStats?.wins || 0,
        losses: existingStats?.losses || 0,
        win_streak: battle_rewards.is_victory ? (existingStats?.win_streak || 0) + 1 : 0,
        highest_streak: battle_rewards.is_victory 
          ? Math.max(existingStats?.highest_streak || 0, (existingStats?.win_streak || 0) + 1)
          : existingStats?.highest_streak || 0,
        total_xp_earned: (existingStats?.total_xp_earned || 0) + battle_rewards.xp_earned,
        total_coins_earned: (existingStats?.total_coins_earned || 0) + battle_rewards.coins_earned,
        updated_at: new Date().toISOString()
      };

      if (battle_rewards.is_victory) {
        statsUpdate.wins++;
      } else {
        statsUpdate.losses++;
      }

      const { error: statsError } = await supabase
        .from('battle_stats')
        .upsert(statsUpdate);

      if (statsError) throw statsError;

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          xp: { increment: battle_rewards.xp_earned },
          coins: { increment: battle_rewards.coins_earned },
          streak: battle_rewards.is_victory ? { increment: 1 } : { set: 0 },
          updated_at: new Date().toISOString()
        })
        .eq('id', user_id);

      if (profileError) throw profileError;

      // Update user progress
      const { error: progressError } = await supabase
        .from('user_progress')
        .update({
          xp: { increment: battle_rewards.xp_earned },
          coins: { increment: battle_rewards.coins_earned },
          streak: battle_rewards.is_victory ? { increment: 1 } : { set: 0 },
          battle_stats: {
            total_battles: statsUpdate.total_battles,
            wins: statsUpdate.wins,
            losses: statsUpdate.losses,
            win_streak: statsUpdate.win_streak,
            highest_streak: statsUpdate.highest_streak,
            total_xp_earned: statsUpdate.total_xp_earned,
            total_coins_earned: statsUpdate.total_coins_earned
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id);

      if (progressError) throw progressError;

    } catch (error) {
      console.error('Error updating battle rewards:', error);
      throw error;
    }
  }

  /**
   * Calculates achievement rewards based on achievement data
   * 
   * @param achievement_id - ID of the achievement to calculate rewards for
   * @returns Array of calculated rewards
   */
  private static calculate_achievement_rewards(achievement_id: string): Reward[] {
    const achievement = BATTLE_ACHIEVEMENTS[achievement_id as keyof typeof BATTLE_ACHIEVEMENTS];
    if (!achievement) return [];

    return [{
      id: `achievement_${achievement.id}`,
      type: 'xp',
      value: achievement.points,
      rarity: achievement.rarity,
      name: `${achievement.id} Achievement Reward`,
      description: 'XP earned from achievement',
      amount: 1,
      metadata: {
        source: 'achievement_completion',
        achievement_id: achievement.id,
        category: achievement.category
      }
    }];
  }
}

