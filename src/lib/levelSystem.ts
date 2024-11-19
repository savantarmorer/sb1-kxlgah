import { LEVEL_CONFIG } from './gameConfig';
import { User } from '../types';

interface LevelUpReward {
  type: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  value: string;
}

export class LevelSystem {
  private static readonly BASE_XP = 100;
  private static readonly GROWTH_FACTOR = 1.5;

  /**
   * Calculates the XP required for a specific level
   * @param level - Target level
   * @returns XP required for the level
   */
  static calculateXPForLevel(level: number): number {
    return Math.floor(this.BASE_XP * Math.pow(this.GROWTH_FACTOR, level - 1));
  }

  /**
   * Calculates total XP required up to a level
   * @param level - Target level
   * @returns Total XP required
   */
  static calculateTotalXPForLevel(level: number): number {
    let totalXP = 0;
    for (let i = 1; i < level; i++) {
      totalXP += this.calculateXPForLevel(i);
    }
    return totalXP;
  }

  /**
   * Calculates XP needed for next level
   * @param currentXP - Current XP amount
   * @returns XP needed for next level
   */
  static calculateXPToNextLevel(currentXP: number): number {
    const currentLevel = this.calculateLevel(currentXP);
    const nextLevelXP = this.calculateTotalXPForLevel(currentLevel + 1);
    return nextLevelXP - currentXP;
  }

  /**
   * Calculates current level based on XP
   * @param xp - Current XP amount
   * @returns Current level
   */
  static calculateLevel(xp: number): number {
    let level = 1;
    let totalXP = 0;
    
    while (totalXP <= xp) {
      totalXP += this.calculateXPForLevel(level);
      if (totalXP > xp) break;
      level++;
    }
    
    return level;
  }

  /**
   * Calculates progress percentage to next level
   * @param xp - Current XP amount
   * @returns Progress percentage (0-100)
   */
  static calculateProgress(xp: number): number {
    const currentLevel = this.calculateLevel(xp);
    const currentLevelXP = this.calculateTotalXPForLevel(currentLevel);
    const nextLevelXP = this.calculateTotalXPForLevel(currentLevel + 1);
    const levelXP = nextLevelXP - currentLevelXP;
    const progress = xp - currentLevelXP;
    
    return Math.min(100, Math.floor((progress / levelXP) * 100));
  }

  /**
   * Gets rewards for a specific level
   * @param level - Target level
   * @returns Array of rewards
   */
  static getLevelRewards(level: number): LevelUpReward[] {
    const rewards: LevelUpReward[] = [
      {
        type: 'coins',
        rarity: 'common',
        value: (level * 100).toString()
      }
    ];

    // Add special rewards for milestone levels
    if (level % 5 === 0) {
      rewards.push({
        type: 'lootbox',
        rarity: 'rare',
        value: 'milestone_reward'
      });
    }

    if (level % 10 === 0) {
      rewards.push({
        type: 'title',
        rarity: 'epic',
        value: `level_${level}_master`
      });
    }

    return rewards;
  }
}

/**
 * Class Role:
 * - XP and level calculations
 * - Progress tracking
 * - Level-up detection
 * - Reward management
 * 
 * Dependencies:
 * - None (pure calculations)
 * 
 * Used by:
 * - LevelProgress component
 * - XPSystem component
 * - GameContext
 * 
 * Scalability:
 * - Configurable base XP and growth
 * - Pure functions for easy testing
 * - Efficient calculations
 */