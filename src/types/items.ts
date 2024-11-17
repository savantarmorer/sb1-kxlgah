import { RewardRarity } from './index';

export type ItemType = 'material' | 'booster' | 'cosmetic' | 'consumable' | 'equipment';
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ItemEffect {
  type: 'xp_boost' | 'coin_boost' | 'study_boost';
  value: number;
  duration?: number;
}

export interface ItemRequirement {
  type: 'level' | 'achievement' | 'quest' | 'item';
  value: string | number;
  comparison?: 'eq' | 'gte' | 'lte';
}

export interface GameItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  cost: number;
  effects: ItemEffect[];
  requirements: ItemRequirement[];
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
} 