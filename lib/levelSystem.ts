import { LEVEL_CONFIG } from './gameConfig';
import { User } from '../types';

interface LevelUpReward {
  type: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  value: string;
}

export class LevelSystem {
  static calculateLevel(xp: number): number {
    const base_xp = 1000;
    const scalingFactor = 1.5;
    
    let level = 1;
    let requiredXP = base_xp;
    
    while (xp >= requiredXP) {
      level++;
      requiredXP = Math.floor(base_xp * Math.pow(scalingFactor, level - 1));
    }
    
    return level;
  }

  static getXPForLevel(level: number): number {
    const base_xp = 1000;
    const scalingFactor = 1.5;
    
    return Math.floor(base_xp * Math.pow(scalingFactor, level - 1));
  }

  static getProgressToNextLevel(xp: number): number {
    const current_level = this.calculateLevel(xp);
    const current_levelXP = this.getXPForLevel(current_level);
    const next_level_xp = this.getXPForLevel(current_level + 1);
    
    return ((xp - current_levelXP) / (next_level_xp - current_levelXP)) * 100;
  }

  static calculate_xp_for_level(level: number): number {
    return Math.floor(LEVEL_CONFIG.base_xp * Math.pow(LEVEL_CONFIG.scalingFactor, level - 1));
  }

  static calculatetotal_xp_for_level(level: number): number {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += this.calculate_xp_for_level(i);
    }
    return total;
  }

  static calculate_progress(xp: number): number {
    const current_level = this.calculateLevel(xp);
    const totalXPForcurrent_level = this.calculatetotal_xp_for_level(current_level);
    const xpIncurrent_level = xp - totalXPForcurrent_level;
    const xpNeededForNextLevel = this.calculate_xp_for_level(current_level);
    
    return (xpIncurrent_level / xpNeededForNextLevel) * 100;
  }

  static calculate_xp_to_next_level(xp: number): number {
    const current_level = this.calculateLevel(xp);
    const totalXPForcurrent_level = this.calculatetotal_xp_for_level(current_level);
    const xpIncurrent_level = xp - totalXPForcurrent_level;
    const xpNeededForNextLevel = this.calculate_xp_for_level(current_level);
    
    return xpNeededForNextLevel - xpIncurrent_level;
  }

  static getLevelUpRewards(level: number): {
    coins: number;
    items: LevelUpReward[];
  } {
    const rewards = {
      coins: LEVEL_CONFIG.bonusPerLevel * level,
      items: [] as LevelUpReward[]
    };

    // Base rewards for every level
    rewards.items.push({
      type: 'xp',
      rarity: 'common',
      value: '100'
    });

    // Special rewards based on level milestones
    if (level % 5 === 0) {
      rewards.items.push({
        type: 'title',
        rarity: 'rare',
        value: `Level ${level} Master`
      });
    }

    if (level % 10 === 0) {
      rewards.items.push({
        type: 'item',
        rarity: 'epic',
        value: 'Premium Study Material'
      });
    }

    if (level % 25 === 0) {
      rewards.items.push({
        type: 'item',
        rarity: 'legendary',
        value: 'Exclusive Title: Legal Legend'
      });
    }

    return rewards;
  }

  static handleLevelUp(user: User, oldLevel: number, newLevel: number) {
    const rewards = [];
    
    for (let level = oldLevel + 1; level <= newLevel; level++) {
      rewards.push(this.getLevelUpRewards(level));
    }
    
    return rewards;
  }
}