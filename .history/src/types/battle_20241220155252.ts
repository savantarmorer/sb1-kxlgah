/**
 * Enum for Battle Phases
 * Represents different states of a battle
 */
export enum BattlePhase {
  IDLE = 'idle',
  STARTING = 'starting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * Battle Status Type
 * Represents the current status of a battle
 */
export type BattleStatus = 
  | 'idle'
  | 'starting'
  | 'in_progress'
  | 'active'
  | 'completed'
  | 'victory'
  | 'defeat'
  | 'draw'
  | 'error';

/**
 * Battle Score Interface
 * Represents the score state for both players
 */
export interface BattleScore {
  player: number;
  opponent: number;
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
  correct_answer: string;
  category: string;
  difficulty: string;
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
 */
export interface battle_stats {
  user_id: string;
  total_battles: number;
  wins: number;
  losses: number;
  win_streak: number;
  highest_streak: number;
  total_xp_earned: number;
  total_coins_earned: number;
  difficulty: number;
  tournaments_played: number;
  tournaments_won: number;
  tournament_matches_played: number;
  tournament_matches_won: number;
  tournament_rating: number;
  updated_at: string;
}

/**
 * Database battle statistics interface
 * Extends base stats with database-specific fields
 */
export interface DBbattle_stats extends battle_stats {
  rank?: string;
}

export interface Battle {
  id: string;
  player_id: string;
  opponent_id: string;
  score_player: number;
  score_opponent: number;
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
}

/**
 * Initial Battle State
 */
export const initialBattleState: BattleState = {
  status: 'idle',
  current_question: 0,
  total_questions: 0,
  questions: [],
  score: { player: 0, opponent: 0 },
  player_states: {},
  started_at: new Date().toISOString(),
  phase: BattlePhase.Waiting,
  player_answers: [],
  time_left: 0,
  time_per_question: 30,
  opponent: null,
  rewards: {
    xp_earned: 0,
    coins_earned: 0,
    streak_bonus: 0,
    time_bonus: 0
  },
  in_progress: false,
  metadata: {
    is_bot: false,
    phase: BattlePhase.Waiting
  },
  error: null
};

/**
 * Role: Provides initial state for battle system
 * Dependencies:
 * - BattleState interface
 * - Used by BattleContext
 * - Used by battle reducer
 * 
 * Integration Points:
 * - BattleContext initialization
 * - Battle reset functionality
 * - New game creation
 */

/**
 * Battle Metadata Interface
 * Contains additional battle state information
 */
export interface BattleMetadata {
  is_bot?: boolean;
  player_states: Record<string, BattlePlayerState>;
  started_at?: string;
  completed_at?: string;
  winner?: string | null;
  phase?: BattlePhase;
  opponent_id?: string;
  time_taken?: number;
  total_questions?: number;
  time_per_question?: number;
  in_progress?: boolean;
  [key: string]: any;
}

import { Question } from './question';

/**
 * Base Battle State Interface
 * Core battle state properties
 */
export interface BaseBattleState {
  id: string;
  phase: BattlePhase;
  questions: Question[];
  current_question: number;
  player_answers?: boolean[];
  score: BattleScore;
  start_time: number;
  end_time?: number;
  metadata?: BattleMetadata;
  total_questions: number;
  status?: BattleStatus;
}

/**
 * Battle State Interface
 * Extends base state with required metadata
 */
export interface BattleState extends BaseBattleState {
  metadata: BattleMetadata;
}

/**
 * Extended Battle State Interface
 * Adds multiplayer and user-specific properties
 */
export interface ExtendedBattleState extends BattleState {
  metadata: BattleMetadata & {
    player_states: Record<string, BattlePlayerState>;
    is_bot?: boolean;
  };
  user?: {
    id: string;
    xp: number;
    streak: number;
  };
  time_per_question: number;
}

/**
 * Enhanced Battle State Interface
 * Adds additional properties for advanced battle features
 */
export interface EnhancedBattleState extends ExtendedBattleState {
  score_player: number;
  score_opponent: number;
  rewards: Required<BattleRewards>;
  metadata: Required<BattleMetadata>;
  opponent?: BattleOpponent | null;
}

/**
 * Battle Player State Interface
 * Individual player state in a battle
 */
export interface BattlePlayerState {
  answered: boolean;
  answer: string | null;
  score: number;
  correct_count?: number;
  time_bonus: number;
  answers?: boolean[];
}

/**
 * Battle Progress State Interface
 * Tracks battle progress and timing
 */
export interface BattleProgressState {
  currentQuestion: number;
  totalQuestions: number;
  timeLeft: number;
  score: BattleScore;
  answers?: string[];
  startTime?: number;
  endTime?: number;
}

/**
 * Battle Error Interface
 * For error handling and reporting
 */
export interface BattleError {
  message: string;
  timestamp: number;
}

/**
 * Battle Opponent Interface
 * Opponent information
 */
export interface BattleOpponent {
  id: string;
  name: string;
  level: number;
}

/**
 * Battle Rewards Interface
 * Battle completion rewards
 */
export interface BattleRewards {
  xp_earned: number;
  coins_earned: number;
  streak_bonus: number;
  time_bonus: number;
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
      score_player: number; 
      score_opponent: number; 
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
 * Core battle results interface used throughout the application
 */
export interface BattleResults {
  victory: boolean;
  draw: boolean;
  opponent_id?: string | null;
  user_id: string;
  score: {
    player: number;
    opponent: number;
  };
  rewards: {
    xp_earned: number;
    coins_earned: number;
    streak_bonus: number;
  };
  stats: {
    time_taken: number;
    total_questions: number;
    average_time: number;
    correct_answers: number;
  };
}

/**
 * Extended battle results interface for database operations
 * Includes additional fields needed for persistence
 */
export interface DBBattleResults {
  id?: string;
  user_id: string;
  opponent_id: string | null;
  winner_id: string | null;
  score_player: number;
  score_opponent: number;
  xp_earned: number;
  coins_earned: number;
  streak_bonus: number;
  created_at: string;
  is_bot_opponent: boolean;
  difficulty: number;
  draw: boolean;
  time_left: number;
  total_questions: number;
  victory: boolean;
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
  rating: number;
  is_bot: boolean;
  level: number;
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

export interface BattleInitPayload {
  questions: BattleQuestion[];
  time_per_question?: number;
  opponent?: BotOpponent;
}

export interface XPGain {
  amount: number;
  source: string;
  reason?: string;
  timestamp?: number;
  metadata?: {
    battle_id?: string;
    quest_id?: string;
    achievement_id?: string;
  };
}

export interface AchievementCheckData {
  type: 'battle_complete' | 'level_up' | 'streak_milestone' | string;
  data: {
    score?: number;
    isVictory?: boolean;
    totalQuestions?: number;
    [key: string]: any;
  };
}

/**
 * Player interface for matchmaking
 */
export interface Player {
  id: string;
  name: string;
  rating: number;
  level: number;
  avatar_url?: string;
  is_online?: boolean;
  streak?: number;
  metadata?: {
    last_battle?: string;
    total_battles?: number;
    win_rate?: number;
  };
}