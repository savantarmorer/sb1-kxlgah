import { GameItem } from './items';
import { DateTime } from 'luxon';

export interface ItemEffect {
  type: string;
  value: number;
  description?: string;
}

export interface ShopItem {
  id: string;
  item_id: string;
  price: number;
  discount_price?: number;
  discount_ends_at?: DateTime;
  stock?: number;
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
  created_at: string;
}

export interface ShopStats {
  total_items: number;
  featured_items: number;
  total_sales: number;
  total_revenue: number;
  daily_stats: {
    date: string;
    sales: number;
    revenue: number;
  }[];
}

export interface ShopItemResponse {
  id: string;
  item_id: string;
  price: number;
  discount_price: number | null;
  discount_ends_at: string | null;
  stock: number | null;
  is_featured: boolean;
  is_available: boolean;
  item: GameItem & {
    effects?: ItemEffect[];
  };
  created_at: string;
  updated_at: string;
} 