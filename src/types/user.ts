import { InventoryItem } from './items';
import { DBbattle_stats } from './battle';
import { Achievement } from './achievements';

export interface XPGain {
  amount: number;
  timestamp: string | number;
}

export interface LoginStreak {
  current: number;
  best: number;
  last_login: string;
}

export interface UserSettings {
  notifications_enabled: boolean;
  email_notifications: boolean;
  privacy: {
    profile_visible: boolean;
    stats_visible: boolean;
    inventory_visible: boolean;
  };
}

export interface QuizStats {
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  average_time: number;
  completed_quizzes: number;
  streak: number;
  last_quiz_date?: string;
}

export interface UserStats {
  matches_played: number;
  matches_won: number;
  tournaments_played: number;
  tournaments_won: number;
  win_rate: number;
  average_score: number;
  highest_score: number;
  current_streak: number;
  best_streak: number;
  total_correct_answers: number;
  total_questions_answered: number;
  accuracy_rate: number;
  fastest_answer_time: number;
  average_answer_time: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  avatar: string;
  avatarFrame: string;
  battle_rating: number;
  achievements: Achievement[];
  constitutionalScore: number;
  civilScore: number;
  criminalScore: number;
  administrativeScore: number;
  login_streak?: {
    count: number;
    last_login: string;
  };
  // Core properties from profiles table
  title?: string;
  is_super_admin?: boolean;
  study_time: number;
  constitutional_score: number;
  civil_score: number;
  criminal_score: number;
  administrative_score: number;
  created_at?: string;
  updated_at?: string;
  is_bot?: boolean;

  // Game-related properties
  battle_stats?: DBbattle_stats;
  quiz_stats?: QuizStats;
  streakMultiplier?: number;
  rewardMultipliers: {
    xp: number;
    coins: number;
  };
  roles?: string[];
  is_online?: boolean;

  // Inventory
  inventory: InventoryItem[];
  backpack: InventoryItem[];

  // Computed properties
  isAdmin?: boolean;

  gems?: number;
  premium_currency?: {
    gems: number;
    shards: number;
  };

  // Add missing properties
  username?: string;
  avatar_url?: string;
  stats?: UserStats;
  daily_rewards?: {
    claimed_today: boolean;
    streak: number;
    streak_multiplier: number;
    next_reward: {
      day: number;
      rarity: string;
      reward_value: number;
      reward_type: string;
    };
  };
  last_login_date?: string;
  rating?: number;
  avatar_id?: number;
}

export interface UserUpdateData extends Partial<User> {
  id: string;
  roles?: string[];
}

/**
 * Role: User data structure
 * Dependencies:
 * - Achievement type
 * - InventoryItem type
 * - battle_stats type
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

