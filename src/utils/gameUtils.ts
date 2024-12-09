/**
 * Game utility functions for XP, level calculations, and other game mechanics
 */

import { GameConfig } from '../config/gameConfig';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { Achievement } from '../types/achievements';
import { BattleRewards } from '../types/battle';
import { GameItem, InventoryItem, UserInventoryItem } from '../types/items';
import { XPGain, LevelData, AchievementReward } from '../types/progress';

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
export const calculate_level_xp = (level: number): number => {
  const { base_xp, growth_factor, max_level } = BATTLE_CONFIG.progress;
  if (level > max_level) return 0;
  return Math.floor(base_xp * Math.pow(growth_factor, level - 1));
};

/**
 * Calculates the user's current level based on total XP
 * Used by:
 * - Level-up system in GameContext
 * - Progress display in LevelProgress
 * - Achievement tracking
 * @param total_xp - Total experience points
 * @returns Current level number
 */
export const calculate_level = (total_xp: number): number => {
  const { max_level } = BATTLE_CONFIG.progress;
  let level = 1;
  let total_xp_required = 0;
  
  while (level < max_level) {
    const next_level_xp = calculate_level_xp(level);
    if (total_xp_required + next_level_xp > total_xp) break;
    total_xp_required += next_level_xp;
    level++;
  }
  
  return level;
};

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
export const calculate_xp_for_next_level = (current_level: number): number => {
  const { max_level } = BATTLE_CONFIG.progress;
  if (current_level >= max_level) return 0;
  return calculate_level_xp(current_level + 1);
};

/**
 * Calculate total XP required to reach a specific level
 * 
 * @param level - Target level
 * @returns Total XP required
 */
export const calculate_total_xp_for_level = (level: number): number => {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += calculate_level_xp(i);
  }
  return total;
};

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
export const calculate_xp_progress = (total_xp: number, current_level: number): number => {
  const { max_level } = BATTLE_CONFIG.progress;
  
  if (current_level >= max_level) return 100;
  
  const current_level_total_xp = calculate_total_xp_for_level(current_level);
  const next_level_total_xp = calculate_total_xp_for_level(current_level + 1);
  const xp_in_current_level = total_xp - current_level_total_xp;
  const xp_needed_for_next_level = next_level_total_xp - current_level_total_xp;
  
  return Math.min(100, Math.floor((xp_in_current_level / xp_needed_for_next_level) * 100));
};

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
  const level = calculate_level(xp);
  const next_level_xp = level < BATTLE_CONFIG.progress.max_level ? calculate_xp_for_next_level(level) : 0;
  const total_xp_for_level = calculate_total_xp_for_level(level);
  const percentToNextLevel = calculate_xp_progress(xp, level);

  return {
    level,
    current_xp: xp,
    total_xp_for_level,
    next_level_xp,
    percentToNextLevel
  };
};

/**
 * Calculate coin rewards based on level and streak
 * @param base_amount Base coin amount
 * @param level User level
 * @param streak Current streak (optional)
 * @returns Final coin amount
 */
export const calculate_coin_reward = (
  base_amount: number,
  level: number,
  streak: number = 0
): number => {
  const level_multiplier = 1 + (level - 1) * 0.1; // 10% increase per level
  const streak_multiplier = 1 + Math.min(streak, 5) * 0.2; // Up to 100% bonus for 5 streak
  
  return Math.floor(base_amount * level_multiplier * streak_multiplier);
};

/**
 * Calculate XP rewards based on difficulty and streak
 * @param base_amount Base XP amount
 * @param difficulty Difficulty level (1-5)
 * @param streak Current streak (optional)
 * @returns Final XP amount
 */
export const calculate_xp_reward = (
  base_amount: number,
  difficulty: number,
  streak: number = 0
): number => {
  const difficulty_multiplier = Math.pow(1.2, difficulty - 1); // Exponential scaling with difficulty
  const streak_bonus = update_streak_multiplier(streak);
  const { time_bonus } = BATTLE_CONFIG.rewards;
  const time_bonus_multiplier = time_bonus.multiplier || 0.5; // Default to 0.5 if not set

  // Calculate final XP with proper rounding
  const final_xp = Math.floor(
    base_amount * 
    difficulty_multiplier * 
    streak_bonus * 
    (1 + time_bonus_multiplier)  // Convert multiplier to total factor
  );

  return Math.max(0, final_xp);
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
    (!(obj as GameItem).effects || typeof (obj as GameItem).effects === 'object') &&
    (!(obj as GameItem).requirements || typeof (obj as GameItem).requirements === 'object') &&
    (!(obj as GameItem).metadata || typeof (obj as GameItem).metadata === 'object')
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
    'item' in item &&
    'quantity' in item &&
    typeof item.quantity === 'number' &&
    is_game_item(item.item)
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
  // Filter out invalid items and transform to inventory items
  return items.filter(is_game_item).map(item => {
    // Get user-specific inventory data if it exists
    const user_item_data = user_inventory_map[item.id];

    // Create inventory item combining base item and user data
    const inventory_item: InventoryItem = {
      // Base item properties from items table
      id: item.id,
      name: item.name,
      description: item.description,
      type: item.type,
      rarity: item.rarity,
      cost: item.cost,
      effects: item.effects,
      requirements: item.requirements,
      metadata: item.metadata,
      is_active: item.is_active,
      created_at: item.created_at,
      updated_at: item.updated_at,
      
      // User inventory properties - use data from user_inventory if available,
      // otherwise use defaults
      quantity: user_item_data?.quantity ?? 0,
      equipped: user_item_data?.equipped ?? false,
      acquired_at: user_item_data?.acquired_at ?? new Date().toISOString()
    };

    return inventory_item;
  });
};

/**
 * Validates a game item's data structure and properties
 * More comprehensive than is_game_item type guard
 * 
 * @param item - Item to validate
 * @returns True if item is valid, false otherwise
 */
export const validate_game_item = (item: unknown): item is GameItem => {
  if (!is_game_item(item)) return false;

  // Additional validation beyond type checking
  const game_item = item as GameItem;
  
  return (
    // Required fields must have valid values
    typeof game_item.id === 'string' && game_item.id.length > 0 &&
    typeof game_item.name === 'string' && game_item.name.length > 0 &&
    typeof game_item.description === 'string' &&
    typeof game_item.cost === 'number' && game_item.cost >= 0 &&
    typeof game_item.rarity === 'string' &&
    Array.isArray(game_item.effects) &&
    // Validate each effect has required properties
    game_item.effects.every(effect => 
      typeof effect.type === 'string' &&
      typeof effect.value === 'number'
    )
  );
};

/**
 * Calculate battle rewards based on score, time taken, and streak
 * @param score - Score achieved in the battle
 * @param time_taken - Time taken to complete the battle
 * @param streak - Current streak count
 * @returns BattleRewards object with calculated rewards
 */
export const calculate_battle_rewards = (
  score: number,
  time_taken: number,
  streak: number
): BattleRewards => {
  const { base_xp, base_coins } = BATTLE_CONFIG.progress;
  const { time_bonus, streak_bonus, victory_bonus } = BATTLE_CONFIG.rewards;
  
  // Calculate base rewards
  let xp_earned = score * base_xp;
  let coins_earned = score * base_coins;
  
  // Apply time bonus
  const time_bonus_multiplier = Math.max(0, 1 - (time_taken / BATTLE_CONFIG.question_time));
  const time_bonus_amount = Math.min(time_bonus.max_bonus, xp_earned * time_bonus.multiplier * time_bonus_multiplier);
  
  // Apply streak bonus
  const streak_bonus_amount = Math.min(streak_bonus.max_bonus, xp_earned * streak_bonus.multiplier * streak);
  
  // Apply victory bonus if score is above threshold
  if (score >= BATTLE_CONFIG.matchmaking.victory_threshold) {
    xp_earned *= victory_bonus.xp_multiplier;
    coins_earned *= victory_bonus.coins_multiplier;
  }
  
  return {
    xp_earned: Math.floor(xp_earned + time_bonus_amount),
    coins_earned: Math.floor(coins_earned),
    streak_bonus: Math.floor(streak_bonus_amount),
    time_bonus: Math.floor(time_bonus_amount)
  };
};
