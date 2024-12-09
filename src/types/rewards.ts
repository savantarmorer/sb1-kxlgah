export type RewardRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type RewardType = 'xp' | 'coins' | 'item' | 'lootbox';
export interface Reward {
  id: string;
  type: string;
  value: number;
  name: string;
  description: string;
  amount: number;
  rarity?: RewardRarity;
  metadata?: Record<string, any>;
}

export function isNumericReward(reward: Reward): boolean {
  return reward.type === 'xp' || reward.type === 'coins';
} 

export interface DailyReward {
  day: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  reward_value: number;
  reward_type: string;
}

export interface DailyRewards {
  next_reward: DailyReward;
  streak_multiplier: number;
  claimed_today: boolean;
}


