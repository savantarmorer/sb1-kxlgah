import { BattleResults } from './battle/results';
import { supabase } from '../lib/supabase';
import { InventoryItem } from './items';
import { BattleHistory } from './battle';
import { Achievement } from './achievements';

/**
 * Progress and Progression Type Definitions
 * Contains database models and UI interfaces for progression system
 * 
 * Database Tables:
 * - user_progress: Core progression data
 * - battle_stats: Battle-specific progression
 * - user_achievements: Achievement tracking
 * - profiles: Level and XP summary
 */

// Database Models
export interface DBUserProgress {
  id: string;
  user_id: string;
  xp: number;
  level: number;
  coins: number;
  streak: number;
  achievements: string[];
  inventory: Record<string, number>;
  created_at: string;
  updated_at: string;
  battle_stats: DBbattle_stats;
  reward_multipliers: {
    quest?: number;
    battle?: number;
    achievement?: number;
    daily?: number;
    streak?: number;
  };
  streak_multiplier: number;
  recent_xp_gains: Array<{
    amount: number;
    source: string;
    timestamp: string;
    details?: {
      quest_id?: string;
      battle_id?: string;
      achievement_id?: string;
    };
  }>;
  last_battle_time: string;
  daily_battles: number;
  last_daily_reset: string;
  battle_history: Array<{
    battle_id: string;
    opponent_id: string;
    result: 'victory' | 'defeat' | 'draw';
    score: {
      player: number;
      opponent: number;
    };
    xp_earned: number;
    coins_earned: number;
    streak_bonus?: number;
    time_bonus?: number;
    timestamp: string;
  }>;
  avatar_id: string | null;
  subject_scores: {
    constitutional?: number;
    civil?: number;
    criminal?: number;
    administrative?: number;
  };
}

export interface DBbattle_stats {
  user_id: string;
  total_battles: number;
  wins: number;
  losses: number;
  win_streak: number;
  highest_streak: number;
  total_xp_earned: number;
  total_coins_earned: number;
  accuracy_rate?: number;
  average_time?: number;
  subject_performance?: {
    constitutional?: number;
    civil?: number;
    criminal?: number;
    administrative?: number;
  };
  updated_at: string;
}

export interface DBUserAchievement {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: number;
  updated_at: string;
  metadata?: {
    steps_completed?: number;
    total_steps?: number;
    last_progress_date?: string;
  };
}

/**
 * UI Interfaces
 */

export interface XPGain {
  amount: number;
  reason: string;
  timestamp: string;
  isCritical: boolean;
  source?: string;
  metadata?: Record<string, any>;
}

export interface LevelData {
  level: number;
  current_xp: number;
  total_xp_for_level: number;
  next_level_xp: number;
  percentToNextLevel: number;
}

export interface AchievementReward {
  xp?: number;
  coins?: number;
  items?: string[];
  metadata?: Record<string, any>;
}

// System-level progression interfaces
export interface SystemXPGain {
  amount: number;
  source: ProgressionSource;
  timestamp: string;
  multiplier: number;
  details?: {
    questId?: string;
    battleId?: string;
    achievementId?: string;
  };
}

export type ProgressionSource = 
  | 'battle'
  | 'quest'
  | 'achievement'
  | 'daily_reward'
  | 'streak_bonus'
  | 'admin_grant';

// Combined progress tracking
export interface ProgressData {
  level: LevelData;
  recentGains: UIXPGain[];
  systemGains: SystemXPGain[];
  totalXP: number;
  achievements: {
    total: number;
    completed: number;
    recent: string[];
  };
  streakData: {
    current: number;
    longest: number;
    multiplier: number;
  };
  battle_stats: {
    totalBattles: number;
    wins: number;
    losses: number;
    winRate: number;
    currentStreak: number;
    highestStreak: number;
  };
}

/**
 * Database Query Result Types
 */
export interface UserProgressQueryResult {
  id: string;
  user_id: string;
  xp: number;
  level: number;
  xp_progress: number;
  coins: number;
  streak: number;
  achievements: string[];
  inventory: InventoryItem[];
  battle_stats: DBbattle_stats;
  reward_multipliers: Record<string, number>;
  streak_multiplier: number;
  recent_xp_gains: Array<{ amount: number; timestamp: string }>;
  last_battle_time: string;
  daily_battles: number;
  last_daily_reset: string;
  battle_history: BattleHistory[];
  created_at: string;
  updated_at: string;
  avatar: string;
  avatarFrame: string;
}

export interface UserAchievementQueryResult {
  user_id: string;
  achievement_id: string;
  unlocked_at: string | null;
  progress: number;
  updated_at: string;
  achievement?: Achievement;
}

/**
 * Achievement Service
 * Handles achievement-related operations and database interactions
 */
export class AchievementService {
  static async getAchievementsToUnlock(user_progress: UserProgressQueryResult) {
    // Basic example: check if user has enough battles for achievements
    const { battle_stats } = user_progress;
    const potentialAchievements = await supabase
      .from('achievements')
      .select('*')
      .eq('category', 'battle')
      .lte('requirements.battles', battle_stats.total_battles);
      
    return (potentialAchievements.data || []) as Achievement[];
  }

  static async updateBattleAchievements(battle_results: BattleResults, user_progress: UserProgressQueryResult) {
    // Check for achievements to unlock after battle
    const achievementsToUnlock = await this.getAchievementsToUnlock(user_progress);
    for (const achievement of achievementsToUnlock) {
      await supabase
        .from('user_achievements')
        .insert({
          user_id: battle_results.user_id,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString(),
          progress: 100
        });
    }
  }
}

// For backward compatibility
export type { XPGain as SystemXPGain, XPGain as UIXPGain };
export type { XPGain as ProgressionXPGain };
export type { XPGain as ProgressionSource };
