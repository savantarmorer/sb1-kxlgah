import { BATTLE_CONFIG } from '../config/battleConfig';

/**
 * Enum for Battle Phases
 * Represents different states of a battle
 */
export enum BattlePhase {
  INITIALIZING = 'INITIALIZING',
  PREPARING = 'PREPARING',
  SEARCHING_OPPONENT = 'SEARCHING_OPPONENT',
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

/**
 * Refined Battle Status
 * Represents all possible states a battle can be in
 */
export type BattleStatus = 'idle' | 'active' | 'completed' | 'error';

/**
 * Battle Score Interface
 * Represents a player's score in a battle
 */
export interface BattleScore {
  player: number;
  opponent: number;
  timestamp?: string;
  metadata?: {
    time_taken?: number;
    streak?: number;
    difficulty?: number;
  };
}

/**
 * Database-aligned Battle Interfaces
 */

export interface BattleQuestion {
  id: string;
  question: string;
  alternative_a: string;
  alternative_b: string;
  alternative_c: string;
  alternative_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
}

export interface BattleHistory {
  id: string;
  user_id: string;
  opponent_id: string;
  winner_id: string;
  score_player: number;
  score_opponent: number;
  xp_earned: number;
  coins_earned: number;
  streak_bonus: number;
  created_at: string;
  is_bot_opponent: boolean;
}

export interface BattleRatings {
  user_id: string;
  rating: number;
  wins: number;
  losses: number;
  streak: number;
  highest_streak: number;
  updated_at: string;
}

/**
 * Base battle statistics interface
 * Used for tracking player battle performance and progress
 * 
 * Dependencies:
 * - Used by GameState for battle tracking
 * - Used by UserProgress for stats persistence
 * - Used by Achievement system for unlocks
 */
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
  difficulty: number;
}

export interface Battle {
  id: string;
  player_id: string;
  opponent_id: string;
  player_score: number;
  opponent_score: number;
  is_victory: boolean;
  xp_earned: number;
  coins_earned: number;
  streak_bonus: number;
  created_at: string;
}

export interface BattleSave {
  id: string;
  user_id: string;
  battle_state: BattleState;
  created_at: string;
  updated_at: string;
}

/**
 * Application State Interfaces
 */

/**
 * Battle Rewards Structure
 * Represents rewards earned from battle completion
 * 
 * Database Mapping:
 * - Maps to battle_history and battle_stats tables
 * - xp_earned -> battle_history.xp_earned, battle_stats.total_xp_earned
 * - coins_earned -> battle_history.coins_earned, battle_stats.total_coins_earned
 * - streak_bonus -> battle_history.streak_bonus
 * 
 * Dependencies:
 * - Used by BattleState for tracking rewards
 * - Used by BattleResults for displaying rewards
 * - Used by GameContext for updating user progress
 * 
 * Related Components:
 * - BattleResults.tsx: Displays battle rewards
 * - UserProgress.tsx: Updates progress with rewards
 * 
 * Integration Points:
 * - ProgressService: Updates user_progress table
 * - StatsService: Updates battle_stats
 * - AchievementSystem: Triggers achievement checks
 */
export interface BattleRewards {
  xp_earned: number;
  coins_earned: number;
  streak_bonus: number;
  time_bonus: number;
  experience_points?: number;
  bonus_multiplier?: number;
  items_earned?: string[];
  achievements_unlocked?: string[];
  metadata?: {
    battle_id?: string;
    opponent_rating?: number;
    difficulty_bonus?: number;
  };
}

/**
 * Initial Battle State
 */
export const initialBattleState: BattleState = {
  status: 'idle',
  in_progress: false,
  current_question: 0,
  questions: [],
  score: {
    player: 0,
    opponent: 0
  },
  player_answers: [],
  time_per_question: BATTLE_CONFIG.time_per_question,
  time_left: BATTLE_CONFIG.time_per_question,
  opponent: {
    id: 'bot-0',
    name: 'Bot',
    is_bot: true
  },
  rewards: {
    xp_earned: 0,
    coins_earned: 0,
    streak_bonus: 0,
    time_bonus: 0
  },
  metadata: {
    is_bot: true,
    difficulty: 1,
    mode: 'practice'
  }
};

/**
 * Battle State Interface
 * Application state for ongoing battles
 */
export interface BattleState {
  status: BattleStatus;
  score: {
    player: number;
    opponent: number;
  };
  opponent: BotOpponent;
  in_progress: boolean;
  current_question: number;
  questions: BattleQuestion[];
  player_answers: boolean[];
  time_per_question: number;
  time_left: number;
  rewards: {
    xp_earned: number;
    coins_earned: number;
    streak_bonus: number;
    time_bonus: number;
  };
  metadata: {
    is_bot: boolean;
    difficulty?: number;
    mode?: string;
  };
  error?: {
    message: string;
    timestamp: number;
  };
  // Add other necessary properties
}

/**
 * Enhanced Battle State Interface
 */
export interface EnhancedBattleState {
  // Core Battle State
  phase: BattlePhase;
  status: BattleStatus;
  
  // Battle Progression
  current_question: number;
  total_questions: number;
  
  // Scoring
  player_score: number;
  opponent_score: number;
  
  // Metadata
  metadata: {
    battle_id?: string;
    opponent_id?: string;
    is_bot: boolean;
    start_time?: number;
    end_time?: number;
  };
  
  // Rewards and Outcomes
  rewards: {
    xp: number;
    coins: number;
    items?: string[];
    achievements?: string[];
    bonuses?: Array<{
      type: string;
      amount: number;
    }>;
  };
  
  // Error Handling
  error?: {
    message: string;
    timestamp: number;
  };
}

/**
 * Battle Action Types for State Reduction
 */
export type BattleAction = 
  | { type: 'START_BATTLE'; payload: { 
      battle_id: string; 
      opponent_id?: string; 
      is_bot: boolean 
    } }
  | { type: 'BEGIN_BATTLE'; payload: { 
      total_questions: number 
    } }
  | { type: 'ANSWER_QUESTION'; payload: { 
      is_correct: boolean; 
      time_taken: number 
    } }
  | { type: 'COMPLETE_BATTLE'; payload: { 
      is_victory: boolean; 
      player_score: number; 
      opponent_score: number; 
      rewards: {
        xp: number;
        coins: number;
        items?: string[];
        achievements?: string[];
      } 
    } }
  | { type: 'SET_ERROR'; payload: { 
      message: string 
    } }
  | { type: 'RESET_BATTLE' };

/**
 * Battle Results Interface
 * Represents the outcome of a completed battle
 */
export interface BattleResults {
  user_id: string;
  opponent_id: string;
  winner_id: string;
  score_player: number;
  score_opponent: number;
  isVictory: boolean;
  is_bot_opponent: boolean;
  current_question: number;
  total_questions: number;
  time_left: number;
  score: {
    player: number;
    opponent: number;
  };
  coins_earned: number;
  streak_bonus: number;
  difficulty: number;
  player_score: number;
  opponent_score: number;
  is_victory: boolean;
  xp_earned: number;
  xp_gained: number;
  victory: boolean;
  questions_answered: number;
  correct_answers: number;
  time_spent: number;
}

/**
 * Battle Transaction Type (for database interactions)
 */
export interface BattleTransaction {
  id?: string;
  user_id: string;
  opponent_id?: string;
  type: 'battle_start' | 'battle_end';
  status: 'completed' | 'failed' | 'in_progress';
  metadata: Partial<EnhancedBattleState>;
  created_at?: Date;
}

/**
 * Bot opponent interface
 * Represents a bot opponent in battle
 */
export interface BotOpponent {
  id: string;
  name: string;
  is_bot: boolean;
  rating?: number;
}

/**
 * Database schema type for user progress
 * Maps to the user_progress table in the database
 */
export interface UserProgressDB {
  id: string;
  user_id: string;
  xp: number;
  level: number;
  xp_progress: number;
  coins: number;
  streak: number;
  achievements: any[];
  inventory: any[];
  battle_stats: battle_statsDB;
  reward_multipliers: Record<string, number>;
  streak_multiplier: number;
  recent_xp_gains: Array<{ amount: number; timestamp: string }>;
  last_battle_time: string;
  daily_battles: number;
  last_daily_reset: string;
  battle_history: BattleHistory[];
  created_at: string;
  updated_at: string;
}

/**
 * Database schema types for battle-related tables
 */
export interface battle_statsDB extends DBbattle_stats {}

export interface BattleRatingsDB {
  user_id: string;
  rating: number;
  wins: number;
  losses: number;
  streak: number;
  highest_streak: number;
  updated_at: string;
}

/**
 * Dependencies:
 * - None (self-contained type system)
 * 
 * Used By:
 * - BattleContext
 * - GameContext
 * - BattleService
 * - Battle components
 * 
 * Features:
 * - Complete battle state tracking
 * - Score management
 * - Statistics tracking
 * - Achievement integration
 * 
 * Scalability:
 * - Easy to extend states
 * - Flexible question format
 * - Configurable scoring
 * - Comprehensive statistics
 */

export type BattleSoundType = 'battle_start' | 'victory' | 'defeat' | 'correct' | 'wrong';

export interface BattleRewardState {
  xp_earned: number;
  coins_earned: number;
  streak_bonus: number;
  time_bonus: number;
}
