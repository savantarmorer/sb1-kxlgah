/**
 * Core item type definitions
 */
export type ItemType = 'consumable' | 'equipment' | 'material' | 'cosmetic';
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Item effect definition
 * Represents temporary or permanent bonuses from items
 */
export interface ItemEffect {
  type: 'xp_boost' | 'coin_boost' | 'study_boost';
  value: number;
  duration?: number; // Duration in seconds, undefined means permanent
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
 * Base inventory item interface
 * Contains core item properties
 */
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  effects: ItemEffect[];
  requirements: ItemRequirement[];
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Extended game item interface
 * Adds shop-specific properties
 */
export interface GameItem extends InventoryItem {
  cost: number;
  available: boolean;
  shopData?: {
    featured: boolean;
    discount?: number;
    endDate?: string;
  };
}

/**
 * Type Dependencies:
 * - None (self-contained type system)
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
 * Scalability:
 * - Easy to add new item types
 * - Extensible effect system
 * - Flexible requirements
 * - Metadata for custom properties
 * 
 * Related Systems:
 * - Inventory management
 * - Shop system
 * - Quest system
 * - Achievement system
 * 
 * Database Mapping:
 * - Matches Supabase schema
 * - Supports JSON metadata
 * - Handles timestamps
 */ 

