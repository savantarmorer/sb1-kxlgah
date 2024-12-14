import { InventoryItem } from './items';
import { Reward } from './rewards';

/**
 * Available quest types
 */
export enum QuestType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  STORY = 'story',
  BATTLE = 'battle',
  STUDY = 'study',
  ACHIEVEMENT = 'achievement',
  STREAK = 'streak',
  COLLECTION = 'collection',
  SOCIAL = 'social'
}

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
export enum QuestStatus {
  AVAILABLE = 'available',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Quest categories
 */
export type QuestCategory = 
  | 'general' 
  | 'battle' 
  | 'study' 
  | 'social'
  | 'achievement'
  | 'streak'
  | 'collection';

/**
 * Interface for quest requirements in database
 */
export interface QuestRequirementDB {
  quest_id: string;
  type: string;
  value: number;
  description: string;
  completed: boolean;
  id: string;
}

/**
 * Interface for quest requirements in application
 */
export interface QuestRequirement {
  type: QuestType;
  amount: number;
  target: number;
  current: number;
  description: string;
  progress?: number;
  value?: number;
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
 * Interface for quest progress updates
 */
export interface QuestProgressUpdate {
  quest_id: string;
  progress: number;
  timestamp: string;
  xp_reward?: number;
  coin_reward?: number;
  metadata?: {
    score?: number;
    time_bonus?: boolean;
    streak?: number;
    [key: string]: any;
  };
}

/**
 * Core Quest interface
 */
export interface Quest {
  id: string;
  title: string;
  description: string;
  rewards: Array<{
    type: 'xp' | 'coins' | 'item';
    value: number;
    metadata?: {
      item?: any;
    };
  }>;
  type: string;
  category: string;
  xp_reward: number;
  coin_reward: number;
  requirements: QuestRequirement[];
  is_active: boolean;
  status: QuestStatus;
  progress: number;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

/**
 * Interface for user quests
 */
export interface UserQuest {
  user_id: string;
  quest_id: string;
  status: QuestStatus;
  progress: number;
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

/**
 * Add the missing utility functions
 */
export function isQuestComplete(quest: Quest): boolean {
  return quest.status === QuestStatus.COMPLETED;
}

export function calculateQuestProgress(quest: Quest): number {
  return quest.progress;
}

/**
 * Interface for quest progress
 */
export interface QuestProgress {
  completed: boolean;
  rewards: QuestRewards;
}

/**
 * Interface for quest rewards
 */
export interface QuestRewards {
  xp: number;
  coins: number;
  items?: InventoryItem[];
  metadata?: {
    [key: string]: any;
  };
}

export interface QuestAssignment {
  user_id: string;
  name?: string;
  email?: string;
  status: QuestStatus;
  progress: number;
  completed_at?: string;
}

export interface QuestWithAssignments extends Quest {
  assigned_users: number;
  user_assignments: QuestAssignment[];
}

export interface QuestReward {
  xp: number;
  coins: number;
  items?: string[];
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Role: Defines reward structure for quests
 * Dependencies:
 * - Used by Quest interface
 * - Used by QuestService
 * - Used by quest reducer
 * 
 * Integration Points:
 * - Quest completion handling
 * - Reward distribution system
 * - Progress tracking
 */
