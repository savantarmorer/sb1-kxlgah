import type { User } from './user';
import type { BattleState } from './battle';
import type { Quest } from './quests';
import type { Achievement } from './achievements';
import type { InventoryItem } from './items';
import type { XPGain } from './user';
import type { Reward } from './rewards';
import type { ItemEffect } from './items';
import type { LeaderboardEntry } from './leaderboard';
import type { battle_statsDB } from './battle/stats';

/**
 * GameStatistics interface
 * Maps to database tables:
 * - user_progress
 * - user_statistics
 * - subject_scores
 */
export interface GameStatistics {
  total_xp: number;
  total_coins: number;
  battles_won: number;
  battles_lost: number;
  current_streak: number;
  highest_streak: number;
  quests_completed: number;
  achievements_unlocked: number;
  last_active?: string;
  total_questions_answered?: number;
  correct_answers?: number;
  accuracy_rate?: number;
  average_time?: number;
  subject_scores?: {
    constitutional?: number;
    civil?: number;
    criminal?: number;
    administrative?: number;
  };
  updated_at?: string;
}

export interface GameState {
  user: User | null;
  battle: BattleState | null;
  recentXPGains: number[];
  battle_stats: battle_statsDB;
  leaderboard: any[];
  login_history: any[];
  achievements: any[];
  quests: {
    active: any[];
    completed: any[];
  };
  inventory: {
    items: any[];
    equipped: any[];
  };
  statistics: {
    total_xp: number;
    total_coins: number;
    battles_won: number;
    battles_lost: number;
    current_streak: number;
    highest_streak: number;
    quests_completed: number;
    achievements_unlocked: number;
  };
  error: string | null;
  loading: boolean;
  syncing: boolean;
  showLevelUpReward: boolean;
  current_levelRewards: any[];
  activeEffects: any[];
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
 *   - subject_scores
 *   - user_statistics
 */