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
  avatar_url?: string;
  level: number;
  xp: number;
  coins: number;
  gems?: number;
  streak?: number;
  display_title?: string;
  created_at: string;
  updated_at: string;
}

export interface UserUpdateData extends Partial<User> {
  id: string;
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

