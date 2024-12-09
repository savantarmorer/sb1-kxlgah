import { LucideIcon } from 'lucide-react';

/**
 * Achievement trigger types
 * Defines all possible triggers for achievements
 */
export type AchievementTriggerType = 
  | 'xp_gained'
  | 'highest_streak'
  | 'quests_completed'
  | 'battle_score'
  | 'battle_wins'
  | 'battle_streak'
  | 'battle_rating'
  | 'reward_rarity'
  | 'login_days'
  | 'battles_played'
  | 'level_reached'
  | 'coins_earned';

/**
 * Achievement trigger configuration
 */
export interface AchievementTrigger {
  type: AchievementTriggerType;
  value: number;
  comparison: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
  metadata?: {
    score_type?: string;
    battle_type?: string;
    [key: string]: any;
  };
}

/**
 * Achievement category types
 */
export interface AchievementCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
}

/**
 * Achievement interface
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: LucideIcon;
  progress: number;
  total: number;
  completed: boolean;
  claimed: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlocked: boolean;
  max_progress: number;
  trigger_conditions: any[];
  order_num: number;
  prerequisites: string[];
  dependents: string[];
  order: number;
  unlocked_at?: string;
  metadata?: Record<string, any>;
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

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface TriggerCondition {
  type: string;
  value: number;
  comparison: 'eq' | 'gt' | 'gte' | 'lt' | 'lte';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  rarity: AchievementRarity;
  unlocked: boolean;
  unlocked_at?: Date;
  prerequisites: string[];
  dependents: string[];
  trigger_conditions: TriggerCondition[];
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface AchievementProgress {
  achievement_id: string;
  user_id: string;
  progress: number;
  completed: boolean;
  completed_at?: Date;
  created_at: string;
  updated_at: string;
}
