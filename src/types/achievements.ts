import { LucideIcon } from 'lucide-react';

/**
 * Achievement trigger types
 * Defines all possible triggers for achievements
 */
export type AchievementTriggerType = 
  | 'xp' 
  | 'streak' 
  | 'quest' 
  | 'study_time' 
  | 'score' 
  | 'reward_rarity' 
  | 'login_days'
  | 'battle_score'    // Added battle triggers
  | 'battle_wins'
  | 'battle_streak'
  | 'battle_rating';

/**
 * Achievement trigger configuration
 */
export interface AchievementTrigger {
  type: AchievementTriggerType;
  value: number;
  comparison: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
  metadata?: {
    scoreType?: string;
    battleType?: string;
    [key: string]: any;
  };
}

/**
 * Achievement category types
 */
export type AchievementCategory = 
  | 'battle' 
  | 'quest' 
  | 'learning' 
  | 'social' 
  | 'collection'
  | 'rewards';

/**
 * Achievement interface
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: Date;
  prerequisites: string[];
  dependents: string[];
  triggerConditions: AchievementTrigger[];
  order: number;
  progress?: number;
  metadata?: Record<string, any>;
  icon?: string;
  secret?: boolean;
  shareReward?: boolean;
}

/**
 * Role: Achievement type definitions
 * 
 * Dependencies:
 * - None (pure type definitions)
 * 
 * Used by:
 * - Achievement system
 * - Battle system
 * - Quest system
 * - User profile
 * 
 * Features:
 * - Type-safe achievement definitions
 * - Flexible trigger conditions
 * - Metadata support
 * - Progress tracking
 * 
 * Scalability:
 * - Easy to add new trigger types
 * - Extensible through metadata
 * - Category system
 * - Rarity levels
 */

