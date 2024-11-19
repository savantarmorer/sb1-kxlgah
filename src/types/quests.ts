/**
 * Available quest types
 */
export type QuestType = 'daily' | 'weekly' | 'achievement' | 'story';

/**
 * Quest rarity levels
 */
export type QuestRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Available requirement types for quests
 */
export type QuestRequirementType = 'score' | 'time' | 'battles' | 'streak';

/**
 * Quest statuses
 */
export type QuestStatus = 'available' | 'in_progress' | 'completed' | 'failed';

/**
 * Interface for quest requirements
 */
export interface QuestRequirement {
  id: string;
  type: QuestRequirementType;
  value: number;
  description: string;
  completed: boolean;
}

/**
 * Interface for quest lootbox rewards
 */
export interface QuestLootbox {
  rarity: QuestRarity;
  contents: Array<{
    type: string;
    value: number;
    rarity: QuestRarity;
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
  status: QuestStatus;
  xpReward: number;
  coinReward: number;
  requirements: QuestRequirement[];
  category: string;
  order: number;
  progress?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
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