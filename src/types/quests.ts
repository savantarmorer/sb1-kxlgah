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
 * Quest categories
 */
export type QuestCategory = 'general' | 'battle' | 'study' | 'social';

/**
 * Interface for quest requirements
 */
export interface QuestRequirement {
  id: string;
  type: string;
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
  id?: string;
  title: string;
  description: string;
  type: QuestType;
  status: QuestStatus;
  category: QuestCategory;
  xpReward: number;
  coinReward: number;
  requirements: QuestRequirement[];
  progress: number;
  isActive: boolean;
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

