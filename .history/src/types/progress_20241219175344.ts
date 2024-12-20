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
  source: string;
  reason?: string;
  timestamp?: string;
  details?: {
    quest_id?: string;
    battle_id?: string;
    achievement_id?: string;
  };
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
  items?: Array<{
    id: string;
    type: string;
    amount: number;
  }>;
}

export interface ProgressData {
  xp: number;
  level: number;
  coins: number;
  streak: number;
  achievements: string[];
  inventory: Record<string, number>;
  battle_stats: DBbattle_stats;
  subject_scores: {
    constitutional?: number;
    civil?: number;
    criminal?: number;
    administrative?: number;
  };
}

// For backward compatibility
export type { XPGain as SystemXPGain, XPGain as UIXPGain };
export type { XPGain as ProgressionXPGain };
export type { XPGain as ProgressionSource };
