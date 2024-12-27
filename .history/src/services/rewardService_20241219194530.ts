import { BattleResults, BattleRewards } from '../types/battle/results';
import { Reward } from '../types/rewards';
import { QuestProgress } from '../types/quests';
import { determineBattleStatus } from '../utils/battleUtils';

export class RewardService {
  static calculate_battle_rewards(
    battle_results: BattleResults
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
  } {
    const {
      victory,
      score,
      stats: { time_taken },
      rewards: battle_rewards
    } = battle_results;

    // Convert battle rewards to general rewards format
    const rewards: Reward[] = [
      {
        id: `battle_base_xp_${Date.now()}`,
        type: 'xp',
        value: battle_rewards.xp_earned,
        rarity: victory ? 'rare' : 'common',
        name: 'Battle XP',
        description: 'XP earned from battle',
        amount: 1,
        metadata: {
          source: 'battle_base',
          victory,
          streak_bonus: battle_rewards.streak_bonus
        }
      },
      {
        id: `battle_base_coins_${Date.now()}`,
        type: 'coins',
        value: battle_rewards.coins_earned,
        rarity: victory ? 'rare' : 'common',
        name: 'Battle Coins',
        description: 'Coins earned from battle',
        amount: 1,
        metadata: {
          source: 'battle_base',
          victory,
          streak_bonus: battle_rewards.streak_bonus
        }
      }
    ];

    // Calculate achievements and quest updates
    const achievements: string[] = [];
    const quest_updates: QuestProgress[] = [];

    // Add time bonus reward if applicable
    if (battle_rewards.time_bonus > 0) {
      rewards.push({
        id: `battle_time_bonus_${Date.now()}`,
        type: 'xp',
        value: battle_rewards.time_bonus,
        rarity: 'common',
        name: 'Time Bonus',
        description: 'Bonus XP for quick completion',
        amount: 1,
        metadata: {
          source: 'time_bonus',
          time_taken
        }
      });
    }

    // Calculate summary
    const total_xp = rewards.reduce((sum, r) => r.type === 'xp' ? sum + (r.value as number) : sum, 0);
    const total_coins = rewards.reduce((sum, r) => r.type === 'coins' ? sum + (r.value as number) : sum, 0);

    return {
      rewards,
      achievements,
      quest_updates,
      summary: {
        total_xp,
        total_coins,
        achievements_unlocked: achievements.length,
        quests_updated: quest_updates.length
      }
    };
  }
}

