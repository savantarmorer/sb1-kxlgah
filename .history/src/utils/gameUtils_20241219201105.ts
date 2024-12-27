/**
 * Game utility functions for XP, level calculations, and other game mechanics
 */

import { GameConfig } from '../config/gameConfig';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { Achievement } from '../types/achievements';
import { BattleRewards } from '../types/battle';
import { GameItem, InventoryItem, UserInventoryItem } from '../types/items';
import { XPGain, LevelData, AchievementReward } from '../types/progress';
import { LevelSystem } from '../lib/levelSystem';

/**
 * Game Progress and Level System
 * 
 * This module handles the core progression mechanics of the game:
 * - Experience (XP) tracking
 * - Level calculation
 * - Progress calculation
 * - Reward scaling
 * 
 * Dependencies:
 * - Used by GameContext for state management
 * - Consumed by LevelProgress component for UI
 * - Integrated with BattleResults for reward calculation
 * 
 * Database Integration:
 * - user_progress: Stores XP and level data
 * - profiles: Maintains user level information
 * - battle_stats: Tracks XP earned from battles
 */

/**
 * Calculate XP required for a specific level
 * Base function used by other level calculations
 * 
 * @param level - Target level
 * @returns XP required for this level
 */
export const calculate_level_xp = LevelSystem.calculate_xp_for_level.bind(LevelSystem);

/**
 * Calculates the user's current level based on total XP
 * Used by:
 * - Level-up system in GameContext
 * - Progress display in LevelProgress
 * - Achievement tracking
 * @param total_xp - Total experience points
 * @returns Current level number
 */
export const calculate_level = LevelSystem.calculate_level.bind(LevelSystem);

/**
 * Calculate XP needed for next level
 * 
 * @param current_level - Current user level
 * @returns XP needed for next level or 0 if max level
 * 
 * Dependencies:
 * - BATTLE_CONFIG.rewards
 * - calculate_level_xp
 * Used by:
 * - Level progress displays
 * - XP gain calculations
 * - Achievement tracking
 */
export const calculate_xp_for_next_level = LevelSystem.calculate_xp_to_next_level.bind(LevelSystem);

/**
 * Calculate total XP required to reach a specific level
 * 
 * @param level - Target level
 * @returns Total XP required
 */
export const calculate_total_xp_for_level = LevelSystem.calculate_total_xp_for_level.bind(LevelSystem);

/**
 * Calculate XP progress percentage towards next level
 * 
 * @param total_xp - Total XP points
 * @param current_level - Current user level
 * @returns Progress percentage (0-100)
 * 
 * Dependencies:
 * - calculate_level_xp
 * - calculate_total_xp_for_level
 * Used by:
 * - Progress bars
 * - Level up animations
 * - UI components
 */
export const calculate_xp_progress = LevelSystem.calculate_progress.bind(LevelSystem);

/**
 * Comprehensive level data calculation
 * Centralizes all level-related calculations in one place
 * 
 * @param xp - Current XP amount
 * @returns LevelData object with level info
 * 
 * Dependencies:
 * - calculate_level
 * - calculate_xp_for_next_level
 * - calculate_xp_progress
 * Used by:
 * - GameContext
 * - Level UI components
 * - Achievement system
 */
export const calculate_level_data = (xp: number): LevelData => {
  const level = LevelSystem.calculate_level(xp);
  const next_level_xp = LevelSystem.calculate_xp_to_next_level(xp);
  const total_xp_for_level = LevelSystem.calculate_total_xp_for_level(level);
  const percentToNextLevel = LevelSystem.calculate_progress(xp);

  return {
    level,
    current_xp: xp,
    total_xp_for_level,
    next_level_xp,
    percentToNextLevel
  };
};

/**
 * Calculate streak multiplier based on current streak
 * @param streak Current streak count
 * @returns Multiplier value
 */
export const update_streak_multiplier = (streak: number): number => {
  return Math.min(2, 1 + (streak * 0.1)); // Cap at 2x
};

/**
 * Process and transform subject scores data
 * @param scores_data Raw scores data from database
 * @returns Processed subject scores
 */
export const process_subject_scores = (scores_data: any[] | null) => {
  if (!scores_data) return {};
  return scores_data.reduce((acc, score) => ({
    ...acc,
    [score.subject]: score.score
  }), {});
};

/**
 * Type guard for Achievement objects
 * Validates achievement data structure based on DB schema
 */
export const is_achievement = (obj: unknown): obj is Achievement => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Achievement).id === 'string' &&
    typeof (obj as Achievement).title === 'string' &&
    typeof (obj as Achievement).description === 'string' &&
    typeof (obj as Achievement).category === 'string' &&
    typeof (obj as Achievement).points === 'number' &&
    typeof (obj as Achievement).rarity === 'string' &&
    typeof (obj as Achievement).unlocked === 'boolean' &&
    Array.isArray((obj as Achievement).prerequisites) &&
    Array.isArray((obj as Achievement).dependents) &&
    (!(obj as Achievement).trigger_conditions || typeof (obj as Achievement).trigger_conditions === 'object')
  );
};

/**
 * Type guard for Achievement Rewards
 * Validates reward structure for achievements
 */
export const is_achievement_reward = (obj: unknown): obj is AchievementReward => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    (typeof (obj as AchievementReward).xp === 'number' || 
     typeof (obj as AchievementReward).coins === 'number' || 
     Array.isArray((obj as AchievementReward).items))
  );
};

/**
 * Type guard for Battle Rewards
 * Validates battle reward structure based on database schema
 * 
 * Dependencies:
 * - BattleRewards interface from battle.ts
 * 
 * Used by:
 * - Battle system for reward validation
 * - Progress tracking
 * - Achievement system
 * 
 * Database Integration:
 * - Validates against battle_history schema
 * - Ensures data consistency with battle_stats
 */
export const is_battle_rewards = (obj: unknown): obj is BattleRewards => {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const reward = obj as BattleRewards;
  
  // Required fields
  const hasRequiredFields = 
    typeof reward.xp_earned === 'number' &&
    typeof reward.coins_earned === 'number';

  // Optional fields
  const hasValidOptionalFields = 
    (reward.streak_bonus === undefined || typeof reward.streak_bonus === 'number') &&
    (reward.experience_points === undefined || typeof reward.experience_points === 'number') &&
    (reward.bonus_multiplier === undefined || typeof reward.bonus_multiplier === 'number') &&
    (reward.items_earned === undefined || Array.isArray(reward.items_earned)) &&
    (reward.achievements_unlocked === undefined || Array.isArray(reward.achievements_unlocked)) &&
    (reward.metadata === undefined || typeof reward.metadata === 'object');

  return hasRequiredFields && hasValidOptionalFields;
};

/**
 * Type guard for Game Items
 * Validates item structure based on DB schema
 */
export const is_game_item = (obj: unknown): obj is GameItem => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as GameItem).id === 'string' &&
    typeof (obj as GameItem).name === 'string' &&
    typeof (obj as GameItem).description === 'string' &&
    typeof (obj as GameItem).type === 'string' &&
    typeof (obj as GameItem).rarity === 'string' &&
    typeof (obj as GameItem).cost === 'number' &&
    typeof (obj as GameItem).is_active === 'boolean' &&
    Array.isArray((obj as GameItem).effects) &&
    typeof (obj as GameItem).imageUrl === 'string'
  );
};

/**
 * Type guard for XP Gain events
 * Validates XP gain data structure
 */
export const is_xp_gain = (obj: unknown): obj is XPGain => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as XPGain).amount === 'number' &&
    typeof (obj as XPGain).source === 'string'
  );
};

/**
 * Type guard for Inventory Items
 * Validates inventory item structure based on DB schema
 * 
 * @param obj - Object to validate
 * @returns True if object is a valid InventoryItem
 */
export const is_inventory_item = (obj: unknown): obj is InventoryItem => {
  if (typeof obj !== 'object' || obj === null) return false;

  const item = obj as Partial<InventoryItem>;
  
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.description === 'string' &&
    typeof item.type === 'string' &&
    typeof item.rarity === 'string' &&
    typeof item.quantity === 'number' &&
    typeof item.imageUrl === 'string' &&
    (item.equipped === undefined || typeof item.equipped === 'boolean') &&
    (item.effects === undefined || Array.isArray(item.effects))
  );
};

/**
 * Transforms game items into inventory items with user-specific data
 * Combines base item data with user inventory information
 * 
 * @param items Array of game items to transform
 * @param user_inventory_map Map of user's inventory data indexed by item ID
 * @returns Array of inventory items with user-specific data
 * 
 * Dependencies:
 * - GameItem interface (base item properties)
 * - InventoryItem interface (combined item + user data)
 * - UserInventoryItem interface (user-specific item data)
 * - is_game_item type guard
 * 
 * Used by:
 * - Inventory system (displaying user items)
 * - Shop system (showing owned quantities)
 * - Item management (admin tools)
 * - Quest rewards (item distribution)
 * - Battle rewards (item drops)
 * 
 * Database tables:
 * - items (base item definitions)
 * - user_inventory (user-item relationships)
 * 
 * @remarks
 * This function is crucial for maintaining consistency between
 * the base item definitions and user-specific inventory data.
 * It ensures that all required properties are present and
 * provides default values for missing user inventory data.
 */
export const transform_to_inventory_items = (
  items: GameItem[],
  user_inventory_map: Record<string, UserInventoryItem> = {}
): InventoryItem[] => {
  return items.filter(is_game_item).map(item => {
    const user_item_data = user_inventory_map[item.id];

    const inventory_item: InventoryItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      type: item.type,
      rarity: item.rarity,
      imageUrl: item.imageUrl,
      effects: item.effects,
      quantity: user_item_data?.quantity ?? 0,
      equipped: user_item_data?.equipped ?? false,
      acquired_at: user_item_data?.acquired_at ?? new Date().toISOString(),
      metadata: item.metadata,
      is_active: item.is_active
    };

    return inventory_item;
  });
};

/**
 * Validates a game item's data structure and properties
 */
export const validate_game_item = (item: unknown): item is GameItem => {
  if (!is_game_item(item)) return false;

  const game_item = item as GameItem;
  
  return (
    typeof game_item.id === 'string' && game_item.id.length > 0 &&
    typeof game_item.name === 'string' && game_item.name.length > 0 &&
    typeof game_item.description === 'string' &&
    typeof game_item.cost === 'number' && game_item.cost >= 0 &&
    typeof game_item.rarity === 'string' &&
    Array.isArray(game_item.effects) &&
    game_item.effects.every(effect => 
      typeof effect.type === 'string' &&
      typeof effect.value === 'number'
    )
  );
};
