import type { BattleQuestion, BattleScore } from '../battle';

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

export interface BattleState {
  status: BattleStatus;
  questions: BattleQuestion[];
  current_question: number;
  score: {
    player: number;
    opponent: number;
  };
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
  rewards?: {
    xp_earned: number;
    coins_earned: number;
    streak_bonus: number;
  };
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
  score: {
    player: 0,
    opponent: 0
  },
  player_answers: [],
  time_left: 0,
  time_per_question: 30,
  in_progress: false,
  error: null,
  metadata: {
    is_bot: true,
    difficulty: 1
  }
};

/**
 * Dependencies:
 * - BattleQuestion from battle.ts
 * - BattleScore from battle.ts
 * 
 * Used By:
 * - BattleContext
 * - GameContext
 * - Battle components
 * 
 * Features:
 * - Complete battle state definition
 * - Type-safe status enum
 * - Comprehensive state tracking
 * 
 * Scalability:
 * - Easy to extend
 * - Clear dependencies
 * - Modular design
 */ 