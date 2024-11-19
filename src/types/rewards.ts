export type RewardType = 'xp' | 'coins' | 'item' | 'title' | 'lootbox';
export type RewardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Reward {
  id: string;
  type: RewardType;
  value: number | string;
  rarity: RewardRarity;
}

export interface NumericReward extends Reward {
  value: number;
}

export interface StringReward extends Reward {
  value: string;
}

export function isNumericReward(reward: Reward): reward is NumericReward {
  return typeof reward.value === 'number';
}

export function isStringReward(reward: Reward): reward is StringReward {
  return typeof reward.value === 'string';
}

export const REWARD_CATEGORIES = {
  XP: 'xp',
  COINS: 'coins',
  ITEM: 'item',
  TITLE: 'title',
  BADGE: 'badge'
} as const;

export const RARITY_VALUES = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4
} as const;

export const RARITY_MULTIPLIERS = {
  common: 1,
  rare: 1.5,
  epic: 2,
  legendary: 3
} as const; 