import { LucideIcon } from 'lucide-react';

/**
 * Types of triggers that can unlock achievements
 */
export type AchievementTriggerType = 'streak' | 'xp' | 'quest' | 'study_time' | 'score' | 'reward_rarity' | 'login_days' | 'battle_score' | 'battle_wins' | 'battle_streak';

/**
 * Achievement trigger configuration
 */
export interface AchievementTrigger {
  type: AchievementTriggerType;
  value: number;
  comparison: 'eq' | 'gte' | 'lte' | 'gt' | 'lt';
  metadata?: Record<string, any>; // Optional metadata for trigger-specific data
}

/**
 * Achievement rarity levels
 */
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Core achievement interface
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  rarity: AchievementRarity;
  unlocked: boolean;
  unlockedAt: Date;
  prerequisites: string[];
  dependents: string[];
  triggerConditions: AchievementTrigger[];
  order: number;
  progress?: number; // Optional progress tracking (0-100)
  metadata?: Record<string, any>; // Optional achievement-specific data
}

/**
 * Achievement category configuration
 */
export interface AchievementCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
}

/**
 * Achievement tier configuration
 */
export interface AchievementTier {
  name: string;
  threshold: number;
  icon: LucideIcon;
  color: string;
  rewards?: {
    type: string;
    value: number | string;
  }[];
}

/**
 * Level up reward payload
 */
export interface LevelUpPayload {
  newLevel: number;
  rewards: {
    coins: number;
    items: Array<{
      type: string;
      rarity: 'common' | 'rare' | 'epic' | 'legendary';
      value: string;
    }>;
  }[];
}