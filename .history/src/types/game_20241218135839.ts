import type { User } from './user';
import type { BattleState } from './battle';
import type { Quest } from './quests';
import type { Achievement } from './achievements';
import type { InventoryItem } from './items';
import type { XPGain } from './user';
import type { Reward } from './rewards';
import type { ItemEffect } from './items';

export interface GameStatistics {
  total_xp: number;
  total_coins: number;
  battles_won: number;
  battles_lost: number;
  current_streak: number;
  highest_streak: number;
  quests_completed: number;
  achievements_unlocked: number;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url?: string;
  score: number;
  rank: number;
}

export interface GameState {
  user: User | null;
  battle: BattleState;
  battle_stats: {
    total_battles: number;
    wins: number;
    losses: number;
    win_streak: number;
    highest_streak: number;
    total_xp_earned: number;
    total_coins_earned: number;
    difficulty?: number;
    tournaments_played?: number;
    tournaments_won?: number;
    tournament_matches_played?: number;
    tournament_matches_won?: number;
    tournament_rating?: number;
    updated_at?: string;
  };
  recentXPGains: XPGain[];
  achievements: Achievement[];
  quests: {
    active: Quest[];
    completed: Quest[];
  };
  inventory: {
    items: InventoryItem[];
    equipped: string[];
  };
  statistics: GameStatistics;
  error: string | null;
  loading: boolean;
  showLevelUpReward: boolean;
  current_levelRewards: Reward[];
  activeEffects: ItemEffect[];
}

/**
 * Role: Core game state definition
 * Dependencies:
 * - User type
 * - BattleState type
 * - Achievement type
 * - Quest type
 * - InventoryItem type
 * 
 * Used by:
 * - GameContext
 * - Game reducer
 * - Battle system
 * - Quest system
 * 
 * Features:
 * - Complete game state tracking
 * - Battle statistics
 * - Achievement tracking
 * - Inventory management
 * 
 * Database mapping:
 * - Maps to multiple tables including:
 *   - profiles
 *   - battle_stats
 *   - user_progress
 *   - user_inventory
 */