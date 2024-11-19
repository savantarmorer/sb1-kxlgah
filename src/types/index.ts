import { Achievement } from './achievements';
import { Quest, QuestType, QuestRequirement, QuestRequirementType } from './quests';
import { Reward, RewardRarity } from './rewards';

// Re-export all types that are used across the application
export * from './quests';
export * from './items';
export * from './rewards';
export * from './actions';
export type { Achievement } from './achievements';

/**
 * Interface for game challenges
 * Used by:
 * - Challenge components
 * - Quest system
 * - Achievement system
 */
export interface Challenge {
  id: string;
  type: string;
  difficulty: number;
  requirements: string[];
}

/**
 * Core User interface
 * Used throughout the application for user data
 * Dependencies:
 * - Achievement type
 * - InventoryItem type
 * - RewardMultipliers type
 */
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
  rewardMultipliers?: {
    xp: number;
    coins: number;
  };
  streakMultiplier?: number;
}

/**
 * Interface for inventory items
 * Used by:
 * - Inventory system
 * - Shop system
 * - Reward system
 */
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'material' | 'booster' | 'cosmetic';
  rarity: RewardRarity;
  uses?: number;
  metadata?: Record<string, any>;
}

// Type guard for checking if an item is equippable
export function isEquippableItem(item: InventoryItem): boolean {
  return item.type === 'cosmetic';
}

// Type guard for checking if an item is consumable
export function isConsumableItem(item: InventoryItem): boolean {
  return item.type === 'booster' && typeof item.uses === 'number';
}

/**
 * Type Dependencies:
 * - Achievement from './achievements'
 * - Quest types from './quests'
 * - Reward types from './rewards'
 * 
 * Used By:
 * - GameContext
 * - User components
 * - Inventory system
 * - Shop system
 * - Battle system
 * 
 * Features:
 * - Type safety for game entities
 * - Modular type system
 * - Type guards for runtime checks
 * 
 * Scalability:
 * - Separated concerns
 * - Easy to extend
 * - Maintainable structure
 */
