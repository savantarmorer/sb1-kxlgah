import { BattleResults, BattleRewards, DBBattleResults } from './results';

// Core Battle Types
export type BattlePhase = 
  | 'idle' 
  | 'preparing'
  | 'in_progress'
  | 'completed'
  | 'victory'
  | 'defeat'
  | 'draw'
  | 'error';

export type BattleStatus = 
  | 'idle'
  | 'preparing'
  | 'active'
  | 'paused'
  | 'completed'
  | 'victory'
  | 'defeat'
  | 'draw'
  | 'error';

export type BattleInitPayload = {
  questions: BattleQuestion[];
  opponent?: BattleOpponent | null;
  time_per_question?: number;
  metadata?: {
    mode?: 'practice' | 'ranked' | 'tournament';
    difficulty?: number;
  };
};

export type BattleActionPayload = BattleInitPayload;

export interface BattleScore {
  player: number;
  opponent: number;
}

// Re-export battle results types
export type { BattleResults, BattleRewards, DBBattleResults };

export interface BattleState {
  id: string;
  status: BattleStatus;
  phase: BattlePhase;
  questions: BattleQuestion[];
  current_question: number;
  total_questions: number;
  opponent: BattleOpponent | null;
  score: BattleScore;
  player_answers: boolean[];
  time_per_question: number;
  time_left: number;
  in_progress: boolean;
  error: string | null;
  rewards: BattleRewards;
  metadata: BattleMetadata;
  player_states: Record<string, BattlePlayerState>;
  started_at: string;
  start_time: number;
}

export interface BattleQuestion {
  id: string;
  text: string;
  question: string;
  options: string[];
  alternative_a: string;
  alternative_b: string;
  alternative_c: string;
  alternative_d: string;
  correct_answer: string;
  category: string;
  subject_area: string;
  difficulty: number;
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
export type BattleSoundType = 
  | 'battle_start' 
  | 'victory' 
  | 'defeat' 
  | 'correct' 
  | 'wrong' 
  | 'effect_use';

export interface BattleRewards {
  xp_earned: number;
  coins_earned: number;
  streak_bonus: number;
  time_bonus: number;
}

export interface BattlePlayerState {
  id: string;
  answered: boolean;
  answer: string | null;
  score: number;
  correct_count: number;
  time_bonus: number;
}

export interface BattleOpponent {
  id: string;
  name: string;
  avatar_url?: string;
  level: number;
  rating: number;
  win_streak: number;
  is_bot: boolean;
  difficulty?: number;
}

export interface Question {
  id: string;
  text?: string;
  question?: string;
  options?: string[];
  alternative_a?: string;
  alternative_b?: string;
  alternative_c?: string;
  alternative_d?: string;
  correct_answer: string;
  category?: string;
  subject_area?: string;
  difficulty: number;
  created_at?: string;
}