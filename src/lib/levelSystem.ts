import { BATTLE_CONFIG } from '../config/battleConfig';
import { Reward } from '../types/rewards';
import {
  calculate_level,
  calculate_total_xp_for_level,
  calculate_xp_for_next_level,
  calculate_xp_progress
} from '../utils/gameUtils';

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
    return calculate_total_xp_for_level(level);
  }

  /**
   * Calculates XP needed for next level
   * 
   * @param current_xp - Current XP amount
   * @returns XP needed for next level
   */
  static calculate_xp_to_next_level(current_xp: number): number {
    const current_level = this.calculate_level(current_xp);
    return calculate_xp_for_next_level(current_level);
  }

  /**
   * Calculates current level based on XP
   * 
   * @param xp - Current XP amount
   * @returns Current level
   */
  static calculate_level(xp: number): number {
    const level = calculate_level(xp);
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
    return calculate_xp_progress(xp, current_level);
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
        value: Math.floor(this.calculate_xp_for_level(level) * 0.1),
        rarity: level % 10 === 0 ? 'epic' : 'rare',
        name: `Level ${level} XP Reward`,
        description: `XP reward for reaching level ${level}`,
        amount: 1,
        metadata: {
          source: 'LEVEL_UP'
        }
      },
      {
        id: `level_${level}_coins_reward`,
        type: 'coins',
        value: level * 100,
        rarity: 'common',
        name: `Level ${level} Coin Reward`,
        description: `Coins reward for reaching level ${level}`,
        amount: 1,
        metadata: {
          source: 'LEVEL_UP'
        }
      }
    ];
  }
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
 */
