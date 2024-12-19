import { GameItem } from './items';
import { PostgrestError } from '@supabase/supabase-js';

export interface ShopItemResponse {
  id: string;
  item_id: string;
  price: number;
  discount_price: number | null;
  discount_ends_at: string | null;
  stock: number | null;
  is_featured: boolean;
  is_available: boolean;
  item: GameItem;
  created_at: string;
  updated_at: string;
}

export interface ShopTransaction {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  price_paid: number;
  transaction_type: 'purchase' | 'refund' | 'gift';
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface ShopState {
  items: ShopItemResponse[];
  loading: boolean;
  error: PostgrestError | null;
  selectedCategory: string | null;
}

export interface ShopFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rarity?: string;
  inStock?: boolean;
  featured?: boolean;
}

export type ShopSort = 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest' | 'oldest';

/**
 * Shop System Types
 * 
 * Purpose:
 * - Define type safety for shop operations
 * - Ensure consistent data structure
 * - Support shop features like filtering and sorting
 * 
 * Used By:
 * - ShopSystem component
 * - ShopManager component
 * - Item components
 * 
 * Database Tables:
 * - shop_items
 * - shop_transactions
 * - items
 */
 