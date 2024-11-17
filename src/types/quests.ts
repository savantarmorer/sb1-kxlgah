/**
 * Available quest types
 */
export type QuestType = 'daily' | 'weekly' | 'epic';

/**
 * Available requirement types for quests
 */
export type QuestRequirementType = 'level' | 'streak' | 'xp' | 'study_time' | 'score';

/**
 * Interface for quest requirements
 */
export interface QuestRequirement {
  id: string;
  description: string;
  type: QuestRequirementType;
  value: number;
  completed: boolean;
  metadata?: Record<string, any>; // For requirement-specific data
}

/**
 * Interface for quest lootbox rewards
 */
export interface QuestLootbox {
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  contents: Array<{
    type: string;
    value: number;
    rarity: string;
  }>;
}

/**
 * Core Quest interface
 */
export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  xpReward: number;
  coinReward: number;
  deadline: Date;
  progress: number;
  requirements: QuestRequirement[];
  lootbox?: QuestLootbox;
  metadata?: Record<string, any>; // For quest-specific data
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

/**
 * Type Dependencies:
 * - Used by GameContext for state management
 * - Used by QuestManager for CRUD operations
 * - Used by QuestEditor for form handling
 * 
 * Database Mapping:
 * - Maps to 'quests' table in Supabase
 * - Handles date conversion for deadline
 * - Supports JSON fields for requirements and lootbox
 * 
 * Features:
 * - Type safety for quest operations
 * - Flexible requirement system
 * - Optional lootbox rewards
 * - Metadata support for extensibility
 * 
 * Scalability:
 * - Modular requirement types
 * - Extensible through metadata
 * - Supports future quest types
 * - Maintains database compatibility
 */ 