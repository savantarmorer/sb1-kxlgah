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
 * Base interface for achievement triggers
 */
export interface BaseTrigger {
  type: AchievementTriggerType;
  value: number;
  comparison: 'eq' | 'gt' | 'gte' | 'lt' | 'lte';
}

/**
 * Achievement trigger configuration with current progress
 */
export interface AchievementTrigger extends BaseTrigger {
  current: number;
}

/**
 * Achievement trigger condition
 */
export interface TriggerCondition extends BaseTrigger {
  current?: number;
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
  points: number;
  rarity: AchievementRarity;
  unlocked: boolean;
  unlocked_at?: string;
  prerequisites: string[];
  dependents: string[];
  trigger_conditions: TriggerCondition[];
  order_num: number;
  progress: number;
  icon: string | LucideIcon;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  total?: number;
  completed?: boolean;
  claimed?: boolean;
  user_achievements?: Array<{
    user_id: string;
    unlocked_at: string | null;
    progress: number;
  }>;
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

export interface AchievementProgress {
  achievement_id: string;
  user_id: string;
  progress: number;
  completed: boolean;
  completed_at?: Date;
  created_at: string;
  updated_at: string;
}
