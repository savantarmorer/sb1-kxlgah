/**
 * Database Types
 * This file contains TypeScript interfaces for all database tables
 */

// Common types
export type Timestamp = string;
export type UUID = string;

// Rarity levels
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

// Difficulty levels
export type Difficulty = 'easy' | 'medium' | 'hard';

// Achievement related types
export interface Achievement {
  id: UUID;
  title: string;
  description: string;
  category: string;
  points: number;
  rarity: Rarity;
  unlocked: boolean;
  unlocked_at?: Timestamp;
  prerequisites?: string[];
  dependents?: string[];
  trigger_conditions: Record<string, any>;
  created_at: Timestamp;
  updated_at: Timestamp;
  order_num: number;
}

// Battle related types
export interface BattleHistory {
  id: UUID;
  user_id: UUID;
  opponent_id: UUID;
  winner_id: UUID;
  score_player: number;
  score_opponent: number;
  xp_earned: number;
  coins_earned: number;
  streak_bonus: number;
  created_at: Timestamp;
  is_bot_opponent: boolean;
}

export interface BattleQuestion {
  id: UUID;
  question: string;
  alternative_a: string;
  alternative_b: string;
  alternative_c: string;
  alternative_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  category: string;
  difficulty: Difficulty;
  created_at: Timestamp;
}

export interface BattleQuestionBackup {
  id: UUID;
  question: string;
  answers: string[];
  correct_answer: string;
  category: string;
  difficulty: Difficulty;
  created_at: Timestamp;
}

export interface BattleRatings {
  user_id: UUID;
  rating: number;
  wins: number;
  losses: number;
  streak: number;
  highest_streak: number;
  updated_at: Timestamp;
}

export interface BattleSave {
  id: UUID;
  user_id: UUID;
  battle_state: Record<string, any>;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface battle_stats {
  user_id: UUID;
  total_battles: number;
  wins: number;
  losses: number;
  win_streak: number;
  highest_streak: number;
  total_xp_earned: number;
  total_coins_earned: number;
  updated_at: Timestamp;
}

export interface Battle {
  id: UUID;
  player_id: UUID;
  opponent_id: UUID;
  player_score: number;
  opponent_score: number;
  is_victory: boolean;
  xp_earned: number;
  coins_earned: number;
  streak_bonus: number;
  created_at: Timestamp;
}

// Course related types
export interface Course {
  id: UUID;
  title: string;
  instructor_id: UUID;
  thumbnail_url: string;
  duration: number;
  student_count: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Reward related types
export interface DailyReward {
  id: UUID;
  day: number;
  reward_type: string;
  reward_value: number;
  rarity: Rarity;
  created_at: Timestamp;
}

// Item related types
export interface Item {
  id: UUID;
  name: string;
  description: string;
  type: string;
  rarity: Rarity;
  cost: number;
  effects: Record<string, any>;
  requirements: Record<string, any>;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Notification related types
export interface NotificationHistory {
  id: UUID;
  user_id: UUID;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: Timestamp;
  read_at?: Timestamp;
  dismissed_at?: Timestamp;
  updated_at: Timestamp;
}

// Performance related types
export interface PerformanceMetric {
  id: UUID;
  context: string;
  duration: number;
  timestamp: Timestamp;
}

// Profile related types
export interface Profile {
  id: UUID;
  name: string;
  title?: string;
  avatar?: string;
  is_super_admin: boolean;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  study_time: number;
  constitutional_score: number;
  civil_score: number;
  criminal_score: number;
  administrative_score: number;
  created_at: Timestamp;
  updated_at: Timestamp;
  is_bot: boolean;
}

// Quest related types
export interface QuestRequirement {
  id: UUID;
  quest_id: UUID;
  type: string;
  value: number;
  description: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Quest {
  id: UUID;
  title: string;
  description: string;
  type: string;
  status: string;
  category: string;
  xp_reward: number;
  coin_reward: number;
  requirements: Record<string, any>;
  progress: number;
  is_active: boolean;
  display_order: number;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by: UUID;
  updated_by: UUID;
  order: number;
  order_num: number;
}

// Quiz related types
export interface QuizAnswer {
  id: UUID;
  question_id: UUID;
  answer_text: string;
  is_correct: boolean;
  explanation?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  answer_order: number;
}

export interface QuizCategory {
  id: UUID;
  name: string;
  description: string;
  icon: string;
  color: string;
  order_position: number;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface QuizQuestion {
  id: UUID;
  category_id: UUID;
  question: string;
  explanation?: string;
  difficulty: Difficulty;
  source?: string;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
  tags: string[];
  answer_time: number;
}

export interface QuizUserResponse {
  id: UUID;
  user_id: UUID;
  question_id: UUID;
  answer_id: UUID;
  is_correct: boolean;
  response_time: number;
  created_at: Timestamp;
}

export interface QuizUserStats {
  user_id: UUID;
  total_questions: number;
  correct_answers: number;
  average_time: number;
  streak: number;
  last_quiz_date: Timestamp;
  updated_at: Timestamp;
}

// Subject related types
export interface SubjectScore {
  id: UUID;
  user_id: UUID;
  subject: string;
  score: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// System related types
export interface SystemLog {
  id: UUID;
  level: string;
  context: string;
  message: string;
  metadata: Record<string, any>;
  error_stack?: string;
  created_at: Timestamp;
}

// User related types
export interface UserAchievement {
  user_id: UUID;
  achievement_id: UUID;
  unlocked_at: Timestamp;
  progress: number;
  updated_at: Timestamp;
}

export interface UserDailyReward {
  user_id: UUID;
  reward_id: UUID;
  claimed_at: Timestamp;
}

export interface UserFollow {
  follower_id: UUID;
  following_id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface UserInventory {
  user_id: UUID;
  item_id: UUID;
  quantity: number;
  equipped: boolean;
  acquired_at: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface UserLogin {
  id: UUID;
  user_id: UUID;
  login_date: Timestamp;
  streak_maintained: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface UserProgress {
  id: UUID;
  user_id: UUID;
  xp: number;
  level: number;
  coins: number;
  streak: number;
  achievements: any[];
  inventory: any[];
  created_at: Timestamp;
  updated_at: Timestamp;
  battle_stats: battle_stats;
  reward_multipliers: Record<string, number>;
  streak_multiplier: number;
  recent_xp_gains: Array<{
    amount: number;
    timestamp: string;
  }>;
  last_battle_time: Timestamp;
  daily_battles: number;
  last_daily_reset: Timestamp;
  battle_history: BattleHistory[];
}

export interface UserQuest {
  id: UUID;
  user_id: UUID;
  quest_id: UUID;
  status: string;
  progress: number;
  completed_at?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface User {
  id: UUID;
  username: string;
  full_name: string;
  avatar_url?: string;
  created_at: Timestamp;
}

// Database interface
export interface Database {
  public: {
    Tables: {
      achievements: {
        Row: Achievement;
        Insert: Omit<Achievement, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Achievement, 'created_at' | 'updated_at'>>;
      };
      battle_history: {
        Row: BattleHistory;
        Insert: Omit<BattleHistory, 'created_at'>;
        Update: Partial<Omit<BattleHistory, 'created_at'>>;
      };
      battle_questions: {
        Row: BattleQuestion;
        Insert: Omit<BattleQuestion, 'created_at'>;
        Update: Partial<Omit<BattleQuestion, 'created_at'>>;
      };
      battle_question_backups: {
        Row: BattleQuestionBackup;
        Insert: Omit<BattleQuestionBackup, 'created_at'>;
        Update: Partial<Omit<BattleQuestionBackup, 'created_at'>>;
      };
      battle_ratings: {
        Row: BattleRatings;
        Insert: Omit<BattleRatings, 'updated_at'>;
        Update: Partial<Omit<BattleRatings, 'updated_at'>>;
      };
      battle_saves: {
        Row: BattleSave;
        Insert: Omit<BattleSave, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BattleSave, 'created_at' | 'updated_at'>>;
      };
      battle_stats: {
        Row: battle_stats;
        Insert: Omit<battle_stats, 'updated_at'>;
        Update: Partial<Omit<battle_stats, 'updated_at'>>;
      };
      battles: {
        Row: Battle;
        Insert: Omit<Battle, 'created_at'>;
        Update: Partial<Omit<Battle, 'created_at'>>;
      };
      courses: {
        Row: Course;
        Insert: Omit<Course, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Course, 'created_at' | 'updated_at'>>;
      };
      daily_rewards: {
        Row: DailyReward;
        Insert: Omit<DailyReward, 'created_at'>;
        Update: Partial<Omit<DailyReward, 'created_at'>>;
      };
      items: {
        Row: Item;
        Insert: Omit<Item, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Item, 'created_at' | 'updated_at'>>;
      };
      notification_history: {
        Row: NotificationHistory;
        Insert: Omit<NotificationHistory, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<NotificationHistory, 'created_at' | 'updated_at'>>;
      };
      performance_metrics: {
        Row: PerformanceMetric;
        Insert: Omit<PerformanceMetric, 'created_at'>;
        Update: Partial<Omit<PerformanceMetric, 'created_at'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'created_at' | 'updated_at'>>;
      };
      quest_requirements: {
        Row: QuestRequirement;
        Insert: Omit<QuestRequirement, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<QuestRequirement, 'created_at' | 'updated_at'>>;
      };
      quests: {
        Row: Quest;
        Insert: Omit<Quest, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Quest, 'created_at' | 'updated_at'>>;
      };
      quiz_answers: {
        Row: QuizAnswer;
        Insert: Omit<QuizAnswer, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<QuizAnswer, 'created_at' | 'updated_at'>>;
      };
      quiz_categories: {
        Row: QuizCategory;
        Insert: Omit<QuizCategory, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<QuizCategory, 'created_at' | 'updated_at'>>;
      };
      quiz_questions: {
        Row: QuizQuestion;
        Insert: Omit<QuizQuestion, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<QuizQuestion, 'created_at' | 'updated_at'>>;
      };
      quiz_user_responses: {
        Row: QuizUserResponse;
        Insert: Omit<QuizUserResponse, 'created_at'>;
        Update: Partial<Omit<QuizUserResponse, 'created_at'>>;
      };
      quiz_user_stats: {
        Row: QuizUserStats;
        Insert: Omit<QuizUserStats, 'updated_at'>;
        Update: Partial<Omit<QuizUserStats, 'updated_at'>>;
      };
      subject_scores: {
        Row: SubjectScore;
        Insert: Omit<SubjectScore, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SubjectScore, 'created_at' | 'updated_at'>>;
      };
      system_logs: {
        Row: SystemLog;
        Insert: Omit<SystemLog, 'created_at'>;
        Update: Partial<Omit<SystemLog, 'created_at'>>;
      };
      user_achievements: {
        Row: UserAchievement;
        Insert: Omit<UserAchievement, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserAchievement, 'created_at' | 'updated_at'>>;
      };
      user_daily_rewards: {
        Row: UserDailyReward;
        Insert: Omit<UserDailyReward, 'created_at'>;
        Update: Partial<Omit<UserDailyReward, 'created_at'>>;
      };
      user_follows: {
        Row: UserFollow;
        Insert: Omit<UserFollow, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserFollow, 'created_at' | 'updated_at'>>;
      };
      user_inventories: {
        Row: UserInventory;
        Insert: Omit<UserInventory, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserInventory, 'created_at' | 'updated_at'>>;
      };
      user_logins: {
        Row: UserLogin;
        Insert: Omit<UserLogin, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserLogin, 'created_at' | 'updated_at'>>;
      };
      user_progress: {
        Row: UserProgress;
        Insert: Omit<UserProgress, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProgress, 'created_at' | 'updated_at'>>;
      };
      user_quests: {
        Row: UserQuest;
        Insert: Omit<UserQuest, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserQuest, 'created_at' | 'updated_at'>>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'created_at'>;
        Update: Partial<Omit<User, 'created_at'>>;
      };
      tournaments: {
        Row: {
          id: string
          title: string
          description: string
          start_date: string
          end_date: string
          entry_fee: number
          max_participants: number
          status: string
          rules: Json
          rewards: Json
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          start_date: string
          end_date: string
          entry_fee: number
          max_participants: number
          status?: string
          rules: Json
          rewards: Json
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          start_date?: string
          end_date?: string
          entry_fee?: number
          max_participants?: number
          status?: string
          rules?: Json
          rewards?: Json
          created_at?: string
        }
      }
      tournament_matches: {
        Row: {
          id: string
          tournament_id: string
          round: number
          player1_id: string
          player2_id: string | null
          winner_id: string | null
          status: string
          score: number | null
          rules: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          round: number
          player1_id: string
          player2_id?: string | null
          winner_id?: string | null
          status?: string
          score?: number | null
          rules?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          round?: number
          player1_id?: string
          player2_id?: string | null
          winner_id?: string | null
          status?: string
          score?: number | null
          rules?: Json | null
          created_at?: string
        }
      }
      tournament_participants: {
        Row: {
          id: string
          tournament_id: string
          user_id: string
          score: number
          matches_played: number
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          user_id: string
          score?: number
          matches_played?: number
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          user_id?: string
          score?: number
          matches_played?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      quest_requirement_type: 'score' | 'time' | 'battles' | 'streak' | 'study_time' | 'items' | 'achievements';
    };
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
