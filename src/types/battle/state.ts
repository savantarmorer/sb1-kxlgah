import type { BattleQuestion, BattleScore } from '../battle';

export type BattleStatus = 'searching' | 'ready' | 'battle' | 'completed';

export interface BattleState {
  status: BattleStatus;
  in_progress: boolean;
  startTime?: string;
  endTime?: string;
  currentOpponent?: string;
  win_streak: number;
  totalBattles: number;
  questions: BattleQuestion[];
  currentQuestion: number;
  score: BattleScore;
  timePerQuestion: number;
  playerAnswers: boolean[];
  time_left?: number;
  streak_bonus?: number;
}

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