import { LevelSystem } from '../lib/levelSystem';
import type { XPGain } from '../types/progression';
import type { BattleRewards } from '../types/battle';

export function calculateBattleRewards(
  isCorrect: boolean,
  timeLeft: number,
  streak: number,
  difficulty: 'easy' | 'medium' | 'hard'
): BattleRewards {
  if (!isCorrect) {
    return {
      total_xp: 0,
      total_coins: 0,
      xp_earned: 0,
      coins_earned: 0,
      time_bonus: 0,
      streak_bonus: 0,
      metadata: {
        base_reward: 0,
        time_bonus: 0,
        streak_bonus: 0,
        difficulty_bonus: 0,
        correct_answers: 0,
        total_questions: 1,
        average_time: 0,
        max_streak: streak,
        damage_dealt: 0,
        damage_taken: 0,
        shield_gained: 0
      }
    };
  }

  // Convert difficulty to numeric value for level system
  const difficultyValue = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;

  // Use level system's battle rewards calculation
  const levelSystemRewards = LevelSystem.calculate_complete_battle_rewards(
    1, // score (1 for correct answer)
    1, // totalQuestions (1 for single question)
    difficultyValue,
    streak,
    timeLeft
  );

  // Calculate difficulty bonus
  const difficultyBonus = difficultyValue === 2 ? 0 : (difficultyValue === 1 ? -25 : 25);

  // Format rewards according to our interface
  return {
    total_xp: levelSystemRewards.xp_earned,
    total_coins: levelSystemRewards.coins_earned,
    xp_earned: levelSystemRewards.xp_earned,
    coins_earned: levelSystemRewards.coins_earned,
    time_bonus: levelSystemRewards.time_bonus,
    streak_bonus: levelSystemRewards.streak_bonus,
    metadata: {
      base_reward: 150, // Keep base reward consistent
      time_bonus: levelSystemRewards.time_bonus,
      streak_bonus: levelSystemRewards.streak_bonus,
      difficulty_bonus: difficultyBonus,
      correct_answers: 1,
      total_questions: 1,
      average_time: 30 - timeLeft,
      max_streak: streak,
      damage_dealt: isCorrect ? 10 : 0,
      damage_taken: isCorrect ? 0 : 5,
      shield_gained: isCorrect ? 2 : 0
    }
  };
}

// Helper function to create XPGain object for game actions
export function createBattleXPGain(
  rewards: BattleRewards,
  battleId: string
): XPGain {
  return {
    amount: rewards.total_xp,
    source: 'battle',
    timestamp: new Date().toISOString(),
    multiplier: 1 + (rewards.metadata.difficulty_bonus / 100),
    details: {
      battleId
    }
  };
} 