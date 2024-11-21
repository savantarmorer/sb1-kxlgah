import { Reward, RewardRarity, RewardType } from '../types/rewards';
import { generateId } from '../utils/generateId';

interface BattleRewardMetadata {
  source: 'battle' | 'battle_perfect' | 'battle_streak';
  streakLevel?: number;
}

/**
 * RewardService
 * Handles reward creation and distribution logic
 * 
 * Dependencies:
 * - Reward types
 * - ID generation utility
 * 
 * Used by:
 * - Battle system
 * - Quest system
 * - Achievement system
 * 
 * Features:
 * - Type-safe reward creation
 * - Metadata tracking
 * - Rarity-based rewards
 */
export class RewardService {
  static createLootboxReward(winStreak: number): Reward {
    const rarity = winStreak >= 9 ? 'legendary' : winStreak >= 6 ? 'epic' : 'rare';
    
    return {
      id: generateId(),
      type: 'lootbox',
      value: `Battle Champion Lootbox (${rarity})`,
      rarity,
      metadata: {
        source: 'battle_streak',
        streakLevel: winStreak
      }
    };
  }

  static getLootboxContents(rarity: string): Reward[] {
    switch (rarity) {
      case 'legendary':
        return [
          { id: generateId(), type: 'xp', value: 1000, rarity: 'legendary' },
          { id: generateId(), type: 'coins', value: 500, rarity: 'legendary' },
          { id: generateId(), type: 'item', value: 'Battle Champion Title', rarity: 'legendary' }
        ];
      case 'epic':
        return [
          { id: generateId(), type: 'xp', value: 500, rarity: 'epic' },
          { id: generateId(), type: 'coins', value: 250, rarity: 'epic' },
          { id: generateId(), type: 'item', value: 'Battle Veteran Title', rarity: 'epic' }
        ];
      default:
        return [
          { id: generateId(), type: 'xp', value: 250, rarity: 'rare' },
          { id: generateId(), type: 'coins', value: 100, rarity: 'rare' }
        ];
    }
  }

  static createBattleRewards(
    experienceGained: number,
    coinsEarned: number,
    isPerfectScore: boolean,
    streakBonus?: number
  ): Reward[] {
    const rewards: Reward[] = [
      this.createReward('xp', experienceGained, isPerfectScore ? 'epic' : 'rare', {
        source: 'battle'
      }),
      this.createReward('coins', coinsEarned, 'rare', {
        source: 'battle'
      })
    ];

    if (isPerfectScore) {
      rewards.push(
        this.createReward('lootbox', 'Perfect Score Chest', 'legendary', {
          source: 'battle_perfect'
        })
      );
    }

    if (streakBonus) {
      rewards.push(
        this.createReward('xp', streakBonus, 'epic', {
          source: 'battle_streak',
          streakLevel: Math.floor(streakBonus / 100)
        })
      );
    }

    return rewards;
  }

  private static createReward(
    type: RewardType,
    value: number | string,
    rarity: RewardRarity,
    metadata?: BattleRewardMetadata
  ): Reward {
    return {
      id: generateId(),
      type,
      value,
      rarity,
      metadata
    };
  }

  static getStreakRewardTier(streak: number): {
    rarity: RewardRarity;
    multiplier: number;
  } {
    if (streak >= 9) return { rarity: 'legendary', multiplier: 3 };
    if (streak >= 6) return { rarity: 'epic', multiplier: 2 };
    if (streak >= 3) return { rarity: 'rare', multiplier: 1.5 };
    return { rarity: 'common', multiplier: 1 };
  }

  static createStreakLootboxContents(streak: number): Reward[] {
    const { rarity, multiplier } = this.getStreakRewardTier(streak);
    const baseRewards = this.getLootboxContents(rarity);
    
    return baseRewards.map(reward => ({
      ...reward,
      value: typeof reward.value === 'number' 
        ? Math.floor(reward.value * multiplier)
        : reward.value,
      metadata: {
        ...reward.metadata,
        streakBonus: true,
        streakLevel: streak
      }
    }));
  }
} 

