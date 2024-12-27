/**
 * Core item type definitions
 * Aligned with database schema
 */
export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  basePrice: number;
  effects: ItemEffect[];
}

export enum ItemType {
  CONSUMABLE = 'consumable',
  EQUIPMENT = 'equipment',
  COSMETIC = 'cosmetic',
  MATERIAL = 'material',
  QUEST = 'quest',
  LOOTBOX = 'lootbox',
  BOOSTER = 'booster'
}

export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

/**
 * Item effect definition
 * Represents temporary or permanent bonuses from items
 */
export type ItemEffectType = 
  | 'xp_boost'
  | 'coin_boost'
  | 'battle_boost'
  | 'streak_protection'
  | 'instant_xp'
  | 'instant_coins'
  | 'quest_boost'
  | 'unlock_content';

export interface ItemEffect {
  type: ItemEffectType;
  value: number;
  duration?: number; // in seconds, undefined means permanent
  metadata?: {
    boost_percentage?: number;
    max_uses?: number;
    content_id?: string;
    requirements?: string[];
    [key: string]: any;
  };
}

/**
 * Item requirement definition
 * Controls when items can be used or equipped
 */
export interface ItemRequirement {
  type: 'level' | 'achievement' | 'quest' | 'item';
  value: string | number;
  comparison?: 'eq' | 'gte' | 'lte';
}

/**
 * Database item interface
 * Matches the 'items' table schema
 */
export interface DBItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  cost: number;
  effects: ItemEffect[];
  requirements: ItemRequirement[];
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * User inventory item interface
 * Matches the 'user_inventory' table schema
 */
export interface UserInventoryItem {
  user_id: string;
  item_id: string;
  quantity: number;
  equipped: boolean;
  acquired_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Base item interface with common properties
 */
export interface BaseItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  cost: number;
  effects: ItemEffect[];
  requirements?: Record<string, any>;
  metadata?: Record<string, any>;
  icon?: string;
  icon_color?: string;
  effect_multiplier?: number;
  allowed_combinations?: string[];
  is_active: boolean;
  imageUrl: string;
}

/**
 * Game item interface for shop display and management
 */
export interface GameItem extends BaseItem {
  shopData?: {
    featured: boolean;
    discount?: number;
    endDate?: string;
  };
}

/**
 * Inventory item interface for user inventory
 */
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  equipped: boolean;
  quantity: number;
  imageUrl: string;
  metadata?: {
    uses?: number;
    [key: string]: any;
  };
  itemId?: string;
  stats?: Record<string, any>;
  effects?: ItemEffect[];
  requirements?: ItemRequirement[];
  acquired_at?: string;
  last_used?: string;
  is_equipped?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Type Dependencies:
 * - Matches database schema
 * - Used by inventory system
 * - Used by shop system
 * 
 * Used By:
 * - Inventory system
 * - Shop system
 * - Item management
 * - Quest requirements
 * - Achievement system
 * 
 * Features:
 * - Type-safe item definitions
 * - Flexible effect system
 * - Requirement validation
 * - Shop integration
 * - Metadata support
 * 
 * Database Mapping:
 * - DBItem -> items table
 * - UserInventoryItem -> user_inventory table
 * - InventoryItem -> Combined view of items and user_inventory
 * - GameItem -> Shop view of items
 */

export enum TransactionType {
  PURCHASE = 'purchase',
  USE = 'use',
  EQUIP = 'equip',
  UNEQUIP = 'unequip'
}

export const ItemTypes = {
  CONSUMABLE: ItemType.CONSUMABLE,
  EQUIPMENT: ItemType.EQUIPMENT,
  COSMETIC: ItemType.COSMETIC,
  MATERIAL: ItemType.MATERIAL,
  QUEST: ItemType.QUEST,
  LOOTBOX: ItemType.LOOTBOX,
  BOOSTER: ItemType.BOOSTER
} as const;
