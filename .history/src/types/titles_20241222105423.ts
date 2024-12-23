export interface DisplayTitle {
  id: string;
  name: string;
  description?: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  is_active: boolean;
  requirements?: {
    level?: number;
    achievements?: string[];
    items?: string[];
  };
  metadata?: {
    color?: string;
    icon?: string;
    special_effects?: string[];
  };
  created_at?: string;
  updated_at?: string;
}

export interface UserDisplayTitle {
  id: string;
  user_id: string;
  title_id: string;
  is_equipped: boolean;
  unlocked_at: string;
  created_at?: string;
  updated_at?: string;
  title?: DisplayTitle; // Joined data
}

export interface TitleStats {
  total_purchases: number;
  revenue_generated: number;
  active_users: number;
  popularity_rank: number;
}

export interface TitlePurchasePayload {
  user_id: string;
  title_id: string;
  price: number;
}

export interface TitleUpdatePayload {
  name?: string;
  description?: string;
  price?: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  is_active?: boolean;
  requirements?: {
    level?: number;
    achievements?: string[];
    items?: string[];
  };
  metadata?: {
    color?: string;
    icon?: string;
    special_effects?: string[];
  };
} 