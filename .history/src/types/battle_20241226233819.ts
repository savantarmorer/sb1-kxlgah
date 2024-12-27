/**
 * Unified Battle State Enum
 */
export enum BattleStateEnum {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  PREPARING = 'PREPARING',
  CARD_SELECTION = 'CARD_SELECTION',
  COMPLETED = 'COMPLETED'
}

/**
 * Battle Difficulty type
 */
export type BattleDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Battle Status type - represents the current state of a battle
 */
export type BattleStatus = BattleStateEnum;

/**
 * Battle Action type - represents possible card actions
 */
export type BattleActionType = 'attack' | 'defense' | 'counter' | 'special';

export const BattleActions = {
  ATTACK: 'attack' as BattleActionType,
  DEFENSE: 'defense' as BattleActionType,
  COUNTER: 'counter' as BattleActionType,
  SPECIAL: 'special' as BattleActionType
};

/**
 * Battle Score Interface
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
  rating?: number;
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
  total_xp: number;
  total_coins: number;
  metadata: {
    correct_answers: number;
    total_questions: number;
    average_time: number;
    max_streak: number;
    damage_dealt: number;
    damage_taken: number;
    shield_gained: number;
  };
}

export const calculateBattleRewards = (
  isCorrect: boolean,
  timeLeft: number,
  streak: number,
  questionDifficulty: 'easy' | 'medium' | 'hard' = 'medium'
): BattleRewards => {
  // Base rewards based on difficulty
  const difficultyMultipliers: Record<'easy' | 'medium' | 'hard', number> = {
    'easy': 0.8,
    'medium': 1.0,
    'hard': 1.2
  };

  const baseXP = isCorrect ? 100 : 0;
  const difficultyMultiplier = difficultyMultipliers[questionDifficulty];

  // Calculate bonuses
  const timeBonus = Math.ceil((timeLeft / 30) * 100); // Up to 100% bonus based on time
  const streakBonus = streak * 10; // 10% bonus per streak

  // Calculate total rewards
  const bonusMultiplier = 1 + (timeBonus + streakBonus) / 100;
  const totalXP = Math.ceil(baseXP * bonusMultiplier * difficultyMultiplier);
  const totalCoins = Math.ceil(totalXP / 2); // Coins are half of XP

  return {
    xp_earned: baseXP,
    coins_earned: Math.ceil(baseXP / 2),
    streak_bonus: streakBonus,
    time_bonus: timeBonus,
    total_xp: totalXP,
    total_coins: totalCoins,
    metadata: {
      correct_answers: isCorrect ? 1 : 0,
      total_questions: 1,
      average_time: 30 - timeLeft,
      max_streak: streak,
      damage_dealt: 0,
      damage_taken: 0,
      shield_gained: 0
    }
  };
};

/**
 * Initial Battle State
 */
export const initialBattleState: BattleState = {
  status: BattleStateEnum.IDLE,
  phase: BattleStateEnum.INITIALIZING,
  player_role: 'promotoria',
  opponent_role: 'defesa',
  score: { player: 0, opponent: 0 },
  current_round: 1,
  total_rounds: 5,
  in_progress: false,
  metadata: {
    is_bot: false,
    game_mode: 'cards'
  },
  error: null,
  playerDeck: [],
  opponentDeck: [],
  lastPlayedCards: {
    player: null,
    opponent: null
  },
  rewards: null,
  winner: null
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
 * Battle State Interface
 * Application state for ongoing battles
 */
export interface BattleState {
  status: BattleStatus;
  phase: BattleStateEnum;
  player_role: 'promotoria' | 'defesa';
  opponent_role: 'promotoria' | 'defesa';
  score: BattleScore;
  current_round: number;
  total_rounds: number;
  in_progress: boolean;
  metadata: {
    is_bot: boolean;
    game_mode: 'cards';
    difficulty?: number;
  };
  error: string | null;
  playerDeck: Card[];
  opponentDeck: Card[];
  lastPlayedCards: {
    player: Card | null;
    opponent: Card | null;
  };
  rewards: BattleRewards | null;
  winner: string | null;
  time_left?: number;
  current_question?: number;
}

/**
 * Enhanced Battle State Interface
 * Extends BattleState with additional properties for advanced features
 */
export interface EnhancedBattleState extends Omit<BattleState, 'metadata'> {
  metadata: {
    is_bot: boolean;
    difficulty: number;
    game_mode: 'cards';
    mode: 'practice' | 'ranked' | 'tournament';
  };
}

/**
 * Battle Action Types for State Reduction
 */
export type BattleAction = 'attack' | 'defense' | 'counter';

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
export interface battle_statsDB {
  user_id: string;
  total_battles: number;
  wins: number;
  losses: number;
  win_streak: number;
  highest_streak: number;
  total_xp_earned: number;
  total_coins_earned: number;
  tournaments_played: number;
  tournaments_won: number;
  tournament_matches_played: number;
  tournament_matches_won: number;
  tournament_rating: number;
  difficulty: number;
  updated_at: string;
}

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
  player_role?: 'promotoria' | 'defesa';
  opponent?: any;
  is_bot?: boolean;
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

export interface BattleMetadata {
  is_bot: boolean;
  difficulty: number;
  game_mode: 'cards';
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

export interface Player {
  id: string;
  name: string;
  rating: number;
  level: number;
  avatar_url?: string;
  streak?: number;
  title?: string;
  is_bot?: boolean;
}

export interface PlayerState {
  health: number;
  shield: number;
  isReady: boolean;
}

export const initialPlayerState: PlayerState = {
  health: 100,
  shield: 0,
  isReady: false
};

export const ACTION_ADVANTAGES: Record<BattleAction, BattleAction> = {
  'attack': 'counter',
  'defense': 'attack',
  'counter': 'defense'
};

export const calculateDamage = (
  attackerAction: BattleAction,
  defenderAction: BattleAction,
  timeRemaining: number,
  isCorrect: boolean
): number => {
  if (!isCorrect) return 0;

  // Base damage is the time remaining
  const damage = timeRemaining;

  // Modify damage based on action interactions
  if (attackerAction === 'attack') {
    if (defenderAction === 'defense') {
      return 0; // Defense blocks attack
    } else if (defenderAction === 'counter') {
      return damage * 0.5; // Counter reduces attack damage
    }
    return damage; // Full damage against other actions
  }

  if (attackerAction === 'counter' && defenderAction === 'attack') {
    return damage; // Counter deals full damage to attacks
  }

  return 0; // No damage for other combinations
};

export interface BattleResultsProps {
  score: { player: number; opponent: number };
  streak: number;
  on_play_again: () => void;
  on_exit: () => void;
}

/**
 * Card interface for the new battle system
 */
export interface Card {
  id: string;
  name: string;
  type: string;
  power: number;
  defense: number;
  description: string;
  image_url?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  action: BattleActionType;
}

/**
 * Battle Action Types
 */
export type GameAction = 
  | { type: 'INITIALIZE_BATTLE'; payload: BattleInitPayload }
  | { type: 'SET_BATTLE_STATUS'; payload: BattleStateEnum }
  | { type: 'PLAY_CARD'; payload: { playerCard: Card; opponentCard: Card } }
  | { type: 'END_BATTLE' }
  | { type: 'RESET_BATTLE' };

