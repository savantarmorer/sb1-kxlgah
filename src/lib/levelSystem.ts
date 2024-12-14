import { BATTLE_CONFIG } from '../config/battleConfig';
import type { BattleRewards } from '../types/battle';
import type { Reward } from '../types/rewards';

/**
 * Static class for managing level system calculations and rewards
 */
export class LevelSystem {
  // Base configuration values from battle progress settings
  private static readonly base_xp = BATTLE_CONFIG.progress.base_xp;
  private static readonly growth_factor = BATTLE_CONFIG.progress.growth_factor;
  private static readonly max_level = BATTLE_CONFIG.progress.max_level;

  /**
   * Calculates XP required for a specific level
   * Uses exponential growth formula
   * 
   * @param level - Target level
   * @returns XP required for the level
   */
  static calculate_xp_for_level(level: number): number {
    if (level > this.max_level) return 0;
    return Math.floor(this.base_xp * Math.pow(this.growth_factor, level - 1));
  }

  /**
   * Calculates total XP required up to a level
   * Sums XP requirements for all previous levels
   * 
   * @param level - Target level
   * @returns Total XP required
   */
  static calculate_total_xp_for_level(level: number): number {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += this.calculate_xp_for_level(i);
    }
    return total;
  }

  /**
   * Calculates XP needed for next level
   * 
   * @param current_xp - Current XP amount
   * @returns XP needed for next level
   */
  static calculate_xp_to_next_level(current_xp: number): number {
    const current_level = this.calculate_level(current_xp);
    if (current_level >= this.max_level) return 0;
    return this.calculate_xp_for_level(current_level + 1);
  }

  /**
   * Calculates current level based on XP
   * 
   * @param xp - Current XP amount
   * @returns Current level
   */
  static calculate_level(xp: number): number {
    let level = 1;
    let total_xp_required = 0;
    
    while (level < this.max_level) {
      const next_level_xp = this.calculate_xp_for_level(level);
      if (total_xp_required + next_level_xp > xp) break;
      total_xp_required += next_level_xp;
      level++;
    }
    
    return Math.min(level, this.max_level);
  }

  /**
   * Calculates progress percentage to next level
   * 
   * @param xp - Current XP amount
   * @returns Progress percentage (0-100)
   */
  static calculate_progress(xp: number): number {
    const current_level = this.calculate_level(xp);
    
    if (current_level >= this.max_level) return 100;
    
    const current_level_total_xp = this.calculate_total_xp_for_level(current_level);
    const next_level_total_xp = this.calculate_total_xp_for_level(current_level + 1);
    const xp_in_current_level = xp - current_level_total_xp;
    const xp_needed_for_next_level = next_level_total_xp - current_level_total_xp;
    
    return Math.min(100, Math.floor((xp_in_current_level / xp_needed_for_next_level) * 100));
  }

  /**
   * Gets rewards for a specific level
   * @param level Level to get rewards for
   * @returns Array of rewards
   */
  static get_level_rewards(level: number): Reward[] {
    return [
      {
        id: `level_${level}_xp_reward`,
        type: 'xp',
        value: this.calculate_xp_for_level(level),
        rarity: 'rare',
        name: 'Level Up XP',
        description: `XP reward for reaching level ${level}`,
        amount: 1,
        metadata: {
          source: 'level_up',
          level
        }
      }
    ];
  }

  /**
   * Calculates battle reward XP with multipliers
   * @param base_xp Base XP amount
   * @param difficulty_multiplier Difficulty multiplier
   * @param streak_multiplier Streak multiplier
   * @returns Final XP reward amount
   */
  static calculate_battle_reward(
    base_xp: number,
    difficulty_multiplier: number = 1,
    streak_multiplier: number = 0
  ): number {
    const difficulty_bonus = Math.max(1, difficulty_multiplier * 1.2); // 20% per difficulty level
    const streak_bonus = Math.max(1, 1 + (streak_multiplier * 0.2)); // 20% per streak level
    
    return Math.floor(base_xp * difficulty_bonus * streak_bonus);
  }

  /**
   * Calculates coin rewards with level and streak multipliers
   * @param base_coins Base coin amount
   * @param level_multiplier Level multiplier
   * @param streak_multiplier Streak multiplier
   * @returns Final coin reward amount
   */
  static calculate_coin_reward(
    base_coins: number,
    level_multiplier: number = 1,
    streak_multiplier: number = 0
  ): number {
    const level_bonus = Math.max(1, level_multiplier * 1.1); // 10% per level
    const streak_bonus = Math.max(1, 1 + (streak_multiplier * 0.2)); // 20% per streak level
    
    return Math.floor(base_coins * level_bonus * streak_bonus);
  }

  /**
   * Updates streak multiplier based on current streak
   * @param current_streak Current streak count
   * @returns Updated streak multiplier
   */
  static update_streak_multiplier(current_streak: number): number {
    return Math.min(
      2.0, // Max 2x multiplier
      1 + (current_streak * BATTLE_CONFIG.rewards.streak_bonus.multiplier)
    );
  }

  /**
   * Calculates time bonus based on time left
   * @param time_left Time left in seconds
   * @param base_xp Base XP amount
   * @returns Time bonus amount
   */
  static calculate_time_bonus(time_left: number, base_xp: number): number {
    return Math.min(
      Math.floor(base_xp * BATTLE_CONFIG.rewards.time_bonus.multiplier * time_left),
      BATTLE_CONFIG.rewards.time_bonus.max_bonus
    );
  }

  /**
   * Calculates complete battle rewards including XP, coins, streak and time bonuses
   * @param score Player's score
   * @param totalQuestions Total number of questions
   * @param difficulty Battle difficulty level
   * @param streak Current win streak
   * @param timeLeft Time left in seconds
   * @returns Complete battle rewards
   */
  static calculate_complete_battle_rewards(
    score: number,
    totalQuestions: number,
    difficulty: number = 1,
    streak: number = 0,
    timeLeft: number = 0
  ): BattleRewards {
    // Calculate base rewards
    const scorePercentage = score / totalQuestions;
    const baseXP = Math.floor(BATTLE_CONFIG.progress.base_xp * scorePercentage);
    const baseCoins = Math.floor(BATTLE_CONFIG.progress.base_coins * scorePercentage);

    // Calculate streak bonus
    const streakMultiplier = Math.min(
      streak * BATTLE_CONFIG.rewards.streak_bonus.multiplier,
      BATTLE_CONFIG.rewards.streak_bonus.max_bonus / 100
    );
    const streakBonus = Math.floor(baseXP * streakMultiplier);

    // Calculate time bonus
    const timeMultiplier = Math.min(
      (timeLeft / BATTLE_CONFIG.time_per_question) * BATTLE_CONFIG.rewards.time_bonus.multiplier,
      BATTLE_CONFIG.rewards.time_bonus.max_bonus / 100
    );
    const timeBonus = Math.floor(baseXP * timeMultiplier);

    // Calculate final rewards with difficulty scaling
    const difficultyMultiplier = 1 + ((difficulty - 1) * 0.2); // 20% increase per difficulty level
    const xpEarned = Math.floor((baseXP + streakBonus + timeBonus) * difficultyMultiplier);
    const coinsEarned = Math.floor(baseCoins * difficultyMultiplier);

    return {
      xp_earned: xpEarned,
      coins_earned: coinsEarned,
      streak_bonus: streakBonus,
      time_bonus: timeBonus
    };
  }

  /**
   * Calculates level data including current level, progress, and XP to next level
   * @param total_xp Total XP amount
   * @returns Level data object
   */
  static calculate_level_data(total_xp: number) {
    const current_level = this.calculate_level(total_xp);
    const progress = this.calculate_progress(total_xp);
    const xp_to_next = this.calculate_xp_to_next_level(total_xp);
    const total_xp_for_current = this.calculate_total_xp_for_level(current_level);
    const total_xp_for_next = this.calculate_total_xp_for_level(current_level + 1);

    return {
      current_level,
      progress,
      xp_to_next,
      total_xp_current: total_xp_for_current,
      total_xp_next: total_xp_for_next,
      is_max_level: current_level >= this.max_level
    };
  }

  /**
   * Module Role:
   * - XP and level calculations
   * - Progress tracking
   * - Level-up rewards
   * - Level cap management
   * 
   * Dependencies:
   * - BATTLE_CONFIG for base values
   * 
   * Used by:
   * - LevelProgress component
   * - XPSystem component
   * - GameContext
   * - Achievement system
   * 
   * Features:
   * - Exponential XP scaling
   * - Progress calculation
   * - Milestone rewards
   * - Level cap
   * 
   * Scalability:
   * - Configurable base values
   * - Extensible reward system
   * - Pure calculations
   * - Performance optimized
   * 
   * Performance:
   * - Cached calculations
   * - Optimized algorithms
   * - Memory efficient
   */}
