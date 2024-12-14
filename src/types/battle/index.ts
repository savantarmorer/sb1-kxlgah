import { BattleResults, BattleRewards, DBBattleResults } from './results';

// Core Battle Types
export type BattleStatus = 
  | 'idle'
  | 'waiting'
  | 'preparing'
  | 'searching'
  | 'ready'
  | 'active'
  | 'paused'
  | 'completed'
  | 'victory'
  | 'defeat'
  | 'draw'
  | 'error';

export interface BattleScore {
  player: number;
  opponent: number;
}

// Re-export battle results types
export type { BattleResults, BattleRewards, DBBattleResults };

export interface BattleState {
  status: BattleStatus;
  questions: BattleQuestion[];
  current_question: number;
  score: BattleScore;
  player_answers: boolean[];
  time_left: number;
  time_per_question: number;
  in_progress: boolean;
  opponent?: {
    id: string;
    name: string;
    avatar_url?: string;
    level: number;
    rating: number;
    win_streak: number;
    is_bot: boolean;
  };
  error: {
    message: string;
    code?: string;
  } | null;
  rewards?: BattleRewards;
  metadata: {
    is_bot: boolean;
    difficulty: number;
    category?: string;
  };
}

export interface BattleQuestion {
  id: string;
  question: string;
  alternative_a: string;
  alternative_b: string;
  alternative_c: string;
  alternative_d: string;
  correct_answer: string;
  category?: string;
  difficulty?: number;
  created_at?: string;
}

export interface BattleProgressState {
  streak_bonus: number;
  xp_gained: number;
  coins_earned: number;
  time_bonus?: number;
  combo_multiplier?: number;
}

export const initialBattleProgressState: BattleProgressState = {
  streak_bonus: 1,
  xp_gained: 0,
  coins_earned: 0,
};

// Bot Opponent
export interface BotOpponent {
  id: string;
  name: string;
  rating: number;
  is_bot: boolean;
  level: number;
}

// Battle History
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

// Battle Metadata
export interface BattleMetadata {
  is_bot: boolean;
  difficulty: number;
  mode: 'practice' | 'ranked' | 'tournament';
}

// Battle Sound Types
export type BattleSoundType = 'battle_start' | 'victory' | 'defeat' | 'correct' | 'wrong';