import { BattleState } from './state';

export interface BattleProgressState {
  streak_bonus: number;      // Current streak multiplier bonus
  xp_gained: number;         // Total XP earned in battle
  coins_earned: number;      // Total coins earned in battle
  time_bonus?: number;       // Optional time completion bonus
  combo_multiplier?: number; // Optional combo streak multiplier
}

export const initialBattleProgressState: BattleProgressState = {
  streak_bonus: 1,
  xp_gained: 0,
  coins_earned: 0,
};

/**
 * Calculates battle progress state based on current battle state and performance
 */
export function calculateBattleProgress(
  battleState: BattleState,
  correctAnswers: number,
  timeLeft: number,
  currentStreak: number
): BattleProgressState {
  const progress: BattleProgressState = { ...initialBattleProgressState };
  
  // Calculate streak bonus (increases with consecutive wins)
  progress.streak_bonus = Math.min(currentStreak * 0.1 + 1, 2.0);
  
  // Base XP calculation
  const baseXP = correctAnswers * 10;
  progress.xp_gained = Math.round(baseXP * progress.streak_bonus);
  
  // Calculate time bonus if applicable
  if (timeLeft > 0) {
    progress.time_bonus = Math.round(timeLeft / battleState.time_per_question * 5);
    progress.xp_gained += progress.time_bonus;
  }
  
  // Calculate combo multiplier based on consecutive correct answers
  if (correctAnswers >= 3) {
    progress.combo_multiplier = Math.min(1 + (correctAnswers - 2) * 0.1, 1.5);
    progress.xp_gained = Math.round(progress.xp_gained * progress.combo_multiplier);
  }
  
  // Calculate coins earned (based on XP with some randomization)
  progress.coins_earned = Math.round(
    progress.xp_gained * (0.8 + Math.random() * 0.4)
  );
  
  return progress;
}

/**
 * Dependencies:
 * - BattleState from state.ts
 * 
 * Used By:
 * - BattleSystem
 * - BattleResults
 * - RewardSystem
 * 
 * Features:
 * - Progress tracking during battle
 * - Dynamic reward calculations
 * - Streak and combo bonuses
 */ 