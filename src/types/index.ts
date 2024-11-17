<<<<<<< HEAD
import { Achievement } from './achievements';

export * from './quests';
export * from './items';
export * from './rewards';
export * from './actions';
export type { Achievement } from './achievements';

export interface Challenge {
  id: string;
  type: string;
  difficulty: number;
  requirements: string[];
}

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  title?: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  studyTime: number;
  constitutionalScore: number;
  civilScore: number;
  criminalScore: number;
  administrativeScore: number;
  sharedAchievements: Achievement[];
  roles: string[];
  achievements: Achievement[];
  inventory: InventoryItem[];
  backpack?: InventoryItem[];
=======
export interface User {
  id: string;
  name: string;
  level: number;
  xp: number;
  streak: number;
  coins: number;
  achievements: Achievement[];
  inventory: InventoryItem[];
  backpack?: InventoryItem[];
  roles?: string[];
  title?: string;
  avatar?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  coinReward: number;
  deadline: Date;
  type: 'daily' | 'weekly' | 'epic';
  requirements: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
<<<<<<< HEAD
  type: 'material' | 'booster' | 'cosmetic';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  uses?: number;
  metadata?: Record<string, any>;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  coinReward: number;
  type: 'daily' | 'weekly' | 'epic';
  deadline: Date;
  progress: number;
  requirements: {
    id: string;
    description: string;
    type: string;
    value: number;
    completed: boolean;
  }[];
}

export interface Reward {
  type: string;
  value: number | string;
  rarity: RewardRarity;
}

export type RewardRarity = 'common' | 'rare' | 'epic' | 'legendary';
=======
  type: 'booster' | 'material' | 'cosmetic';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  uses?: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank: number;
  avatar: string;
}
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
