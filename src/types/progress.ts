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
  };
  streak_multiplier: number;
  recent_xp_gains: Array<{
    amount: number;
    source: string;
    timestamp: string;
  }>;
  last_battle_time: string;
  daily_battles: number;
  last_daily_reset: string;
  battle_history: string[];
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
  updated_at: string;
}

export interface DBUserAchievement {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: number;
  updated_at: string;
}

// UI-focused progress tracking interfaces
export interface UIXPGain {
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

// Type aliases for backward compatibility
export type XPGain = UIXPGain;
export type ProgressionXPGain = SystemXPGain;

// Database query result types
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

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  points: number;
  requirements: {
    required: number;
    [key: string]: any;
  };
  icon_name?: string;
}

import { BattleResults } from './battle/results';

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
    // ... lógica existente ...

    // Verifique se há conquistas a serem desbloqueadas após a batalha
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

  // ... outras funções ...
}
