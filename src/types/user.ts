import { Achievement } from './achievements';
import { InventoryItem } from './items';

export interface User {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  streak: number;
  coins: number;
  achievements: Achievement[];
  battleRating: number;
  rewardMultipliers: {
    xp: number;
    coins: number;
  };
  streakMultiplier: number;
  lastLoginDate?: string;
  title: string | null;
  inventory?: InventoryItem[];
  backpack?: InventoryItem[];
  roles?: string[];
}

export interface RewardMultipliers {
  xp: number;
  coins: number;
}

/**
 * Role: User data structure
 * Dependencies:
 * - Achievement type
 * - InventoryItem type
 * Used by:
 * - GameContext
 * - User components
 * - Battle system
 * Features:
 * - Core user properties
 * - Battle statistics
 * - Inventory management
 * - Achievement tracking
 */

