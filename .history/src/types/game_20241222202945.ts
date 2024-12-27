import type { User } from './user';
import type { BattleState, BattleRatings } from './battle';
import type { Quest } from './quests';
import type { Achievement } from './achievements';
import type { InventoryItem } from './items';
import type { XPGain } from './user';
import type { Reward } from './rewards';
import type { ItemEffect } from './items';

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

/**
 * LeaderboardEntry interface
 * Maps to database tables:
 * - profiles: username, avatar_url, title, level, xp
 * - battle_stats: rating, streak
 * - user_achievements: achievements count
 */
export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url?: string;
  title?: string;
  score: number;
  rank: number;
  rating?: number;
  streak?: number;
  level?: number;
  achievements_count?: number;
  constitutional_score?: number;
  civil_score?: number;
  criminal_score?: number;
  administrative_score?: number;
  is_super_admin?: boolean;
  created_at?: string;
}

export interface GameState {
  user: User | null;
  battleStats: {
    wins: number;
    losses: number;
    draws: number;
    total_games: number;
  } | null;
  battleRatings: {
    rating: number;
    rank: string;
    tier: string;
  } | null;
  settings: {
    sound_enabled: boolean;
    music_enabled: boolean;
    notifications_enabled: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  loading: boolean;
  error: string | null;
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