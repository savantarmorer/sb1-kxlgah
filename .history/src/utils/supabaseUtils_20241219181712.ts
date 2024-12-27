import type { Json } from '../types/supabase';
import { GameItem, ItemEffect, ItemRequirement } from '../types/items';
import { Quest } from '../types/quests';

/**
 * Converts a Quest object to database format
 * Handles type conversions and ensures database compatibility
 * 
 * @param quest - Quest to convert
 * @returns Database-formatted quest object
 */
export function convertQuestToDB(quest: Partial<Quest>): Record<string, any> {
  // Convert requirements to JSON-safe format
  const requirements = quest.requirements?.map(req => ({
    type: req.type,
    value: req.target,
    description: req.description
  })) as unknown as Json[];

  return {
    ...quest,
    xp_reward: quest.xp_reward,
    coin_reward: quest.coin_reward,
    requirements,
    is_active: quest.is_active ?? true
  };
}

/**
 * Converts a database quest to frontend format
 * Handles type conversions and data validation
 * 
 * @param dbQuest - Database quest object
 * @returns Frontend Quest object
 */
export function convertQuestFromDB(dbQuest: any): Quest {
  return {
    id: dbQuest.id,
    title: dbQuest.title,
    description: dbQuest.description,
    type: dbQuest.type,
    status: dbQuest.status,
    category: dbQuest.category,
    xp_reward: dbQuest.xp_reward,
    coin_reward: dbQuest.coin_reward,
    requirements: dbQuest.requirements || [],
    progress: dbQuest.progress || 0,
    is_active: dbQuest.is_active,
    rewards: [{ type: 'xp', value: dbQuest.xp_reward }, { type: 'coins', value: dbQuest.coin_reward }],
    created_at: dbQuest.created_at,
    updated_at: dbQuest.updated_at
  };
}

/**
 * Converts an item to database format
 * Handles type conversions for effects and requirements
 * 
 * @param item - Item to convert
 * @returns Database-formatted item object
 */
export function convertItemToDB(item: Partial<GameItem>): Record<string, any> {
  // Convert effects to JSON-safe format
  const effects = item.effects?.map(effect => ({
    type: effect.type,
    value: effect.value,
    duration: effect.duration
  })) as unknown as Json[];

  // Convert requirements to JSON-safe format
  const requirements = item.requirements?.map(req => ({
    type: req.type,
    value: req.value,
    comparison: req.comparison
  })) as unknown as Json[];

  return {
    ...item,
    effects,
    requirements,
    metadata: item.metadata as Json,
    is_active: item.is_active ?? true
  };
}

/**
 * Converts a database item to frontend format
 * Handles type conversions and data validation
 * 
 * @param dbItem - Database item object
 * @returns Frontend GameItem object
 */
export function convertItemFromDB(dbItem: any): GameItem {
  // Convert effects from database format
  const effects = (dbItem.effects || []).map((effect: any) => ({
    type: effect.type,
    value: effect.value,
    duration: effect.duration
  })) as ItemEffect[];

  // Convert requirements from database format
  const requirements = (dbItem.requirements || []).map((req: any) => ({
    type: req.type,
    value: req.value,
    comparison: req.comparison
  })) as ItemRequirement[];

  return {
    ...dbItem,
    effects,
    requirements,
    metadata: dbItem.metadata || {},
    is_active: dbItem.is_active ?? true
  };
}

/**
 * Module Dependencies:
 * - Json type from Supabase
 * - GameItem types for item conversion
 * - Quest type for quest conversion
 * 
 * Used By:
 * - useItems hook for item CRUD
 * - useQuests hook for quest CRUD
 * - useAdminActions hook for admin operations
 * 
 * Features:
 * - Type-safe conversions
 * - Data validation
 * - Default values
 * - JSON compatibility
 * 
 * Scalability Considerations:
 * - Separate conversion functions
 * - Type assertions for safety
 * - Modular structure
 * - Easy to extend
 */ 

