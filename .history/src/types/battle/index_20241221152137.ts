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

export interface BattleInitPayload {
  questions: BattleQuestion[];
  opponent: BattleOpponent;
  time_per_question?: number;
  metadata?: {
    mode?: BattleMode;
    difficulty?: number;
  };
}

export type BattleMode = 'practice' | 'ranked' | 'tournament';

export type BattleActionPayload = BattleInitPayload;

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

export interface BattleScore {
  player: number;
  opponent: number;
}

export interface BattleRewards {
  xp_earned: number;
  coins_earned: number;
  streak_bonus: number;
  time_bonus: number;
}

export interface BattleMetadata {
  is_bot: boolean;
  difficulty: number;
  mode: BattleMode;
}

export interface BattlePlayerState {
  id: string;
  answered: boolean;
  answer: string | null;
  score: number;
  correct_count: number;
  time_bonus: number;
}

export { BattleResults, BattleRewards as DBBattleRewards } from './results';

export type { Question };