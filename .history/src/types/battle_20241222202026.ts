/**
 * Battle Types
 */

export type BattleAction = 'inicial' | 'contestacao' | 'reconvencao';

export interface PlayerState {
  health: number;
  shield: number;
  selectedAction: BattleAction | null;
  answer: string | null;
  timeLeft: number;
  isReady: boolean;
  isCorrect: boolean;
}

export const initialPlayerState: PlayerState = {
  health: 50,
  shield: 0,
  selectedAction: null,
  answer: null,
  timeLeft: 0,
  isReady: false,
  isCorrect: false
};

export const ACTION_ADVANTAGES: Record<BattleAction, BattleAction> = {
  'inicial': 'contestacao',
  'contestacao': 'reconvencao',
  'reconvencao': 'inicial'
};

/**
 * Enum for Battle Phases
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
 * Battle Status
 */
export type BattleStatus = 
  | 'idle' 
  | 'preparing' 
  | 'ready'
  | 'active' 
  | 'paused'
  | 'completed'
  | 'victory'
  | 'defeat'
  | 'draw'
  | 'error';

/**
 * Battle Question Interface
 */
export interface BattleQuestion {
  id: string;
  text: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  correct_answer: string;
  category?: string;
}

/**
 * Battle History Interface
 */
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

/**
 * Battle State Interface
 */
export interface BattleState {
  status: BattleStatus;
  questions: BattleQuestion[];
  current_question: number;
  player: PlayerState;
  opponent: PlayerState;
  time_left: number;
  time_per_question: number;
  in_progress: boolean;
  error: {
    message: string;
    code?: string;
  } | null;
  metadata: {
    is_bot: boolean;
    difficulty: number;
    category?: string;
  };
}

export const initialBattleState: BattleState = {
  status: 'idle',
  questions: [],
  current_question: 0,
  player: initialPlayerState,
  opponent: initialPlayerState,
  time_left: 0,
  time_per_question: 30,
  in_progress: false,
  error: null,
  metadata: {
    is_bot: true,
    difficulty: 1
  }
};

export interface BattleStats {
  wins: number;
  losses: number;
  total_games: number;
  best_streak: number;
  current_streak: number;
}

export interface BattleRatings {
  rating: number;
  games_played: number;
  wins: number;
  losses: number;
}
