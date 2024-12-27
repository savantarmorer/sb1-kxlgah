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
      metadata: {
        base_reward: 0,
        time_bonus: 0,
        streak_bonus: 0,
        difficulty_bonus: 0
      }
    };
  }

  // Convert difficulty to numeric value for level system
  const difficultyValue = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;

  // Use level system's battle rewards calculation
  const rewards = LevelSystem.calculate_complete_battle_rewards(
    1, // score (1 for correct answer)
    1, // totalQuestions (1 for single question)
    difficultyValue,
    streak,
    timeLeft
  );

  // Format rewards according to our interface
  return {
    total_xp: rewards.xp_earned,
    total_coins: rewards.coins_earned,
    metadata: {
      base_reward: 150, // Keep base reward consistent
      time_bonus: rewards.time_bonus,
      streak_bonus: rewards.streak_bonus,
      difficulty_bonus: difficultyValue === 2 ? 0 : (difficultyValue === 1 ? -25 : 25)
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