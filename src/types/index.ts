/**
 * Core game types
 */
export type { User } from './user';
export type { 
  GameItem, 
  InventoryItem,
  ItemType, 
  ItemRarity, 
  ItemEffect 
} from './items';
export type { Achievement, AchievementCategory, AchievementTrigger } from './achievements';
export type { 
  BattleRewards, 
  BattleState, 
  BattleStatus, 
  BattleQuestion,
  battle_stats 
} from './battle';
export type { 
  UIXPGain,
  SystemXPGain,
  ProgressionSource,
  LevelData,
  AchievementReward,
  ProgressData,
  // Backward compatibility
  XPGain,
  ProgressionXPGain
} from './progress';
export type { 
  Reward, 
  RewardType, 
  RewardRarity 
} from './rewards';

/**
 * Type Dependencies:
 * This is the central type export file.
 * All commonly used types should be exported here.
 * 
 * Usage:
 * import { Type1, Type2 } from '../types';
 * 
 * Benefits:
 * - Single import source
 * - Easier dependency management
 * - Better type organization
 */

/**
 * Core Challenge interface
 * Used for game challenges and quests
 */
export interface Challenge {
  id: string;
  type: string;
  difficulty: number;
  requirements: string[];
}

/**
 * Type guard for checking if an item is equippable
 * @param item - Item to check
 * @returns boolean indicating if item can be equipped
 */
export { isEquippableItem, isConsumableItem } from './guards/items';

/**
 * Module Role:
 * - Central type definitions
 * - Type re-exports
 * - Type guard functions
 * 
 * Dependencies:
 * - achievements.ts
 * - items.ts
 * - user.ts
 * 
 * Used By:
 * - Components needing type definitions
 * - Services requiring type checking
 * - Utility functions
 * 
 * Features:
 * - Type-safe exports
 * - Utility functions
 * - Type guards
 * 
 * Scalability:
 * - Centralized type management
 * - Easy to extend
 * - Clear dependencies
 * 
 * Best Practices:
 * - Named exports
 * - Type guards
 * - Clear documentation
 * - Modular organization
 * 
 * Related Files:
 * - achievements.ts
 * - items.ts
 * - user.ts
 * - actions.ts
 */
