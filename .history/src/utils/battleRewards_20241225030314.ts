import { LevelSystem } from '../lib/levelSystem';
import type { XPGain } from '../types/progression';
import type { BattleRewards } from '../types/battle';

export function calculateBattleRewards(
  isCorrect: boolean,
  timeLeft: number,
  streak: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
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

  // Convert difficulty to numeric multiplier
  const difficultyMultiplier = {
    'easy': 1,
    'medium': 1.2,
    'hard': 1.4
  }[difficulty] || 1.2;

  // Use LevelSystem's complete battle rewards calculation
  const rewards = LevelSystem.calculate_complete_battle_rewards(
    1, // score (1 for correct answer)
    1, // totalQuestions (1 for single question)
    difficultyMultiplier,
    streak,
    timeLeft
  );

  // Format the rewards to match the expected interface
  return {
    total_xp: rewards.xp_earned,
    total_coins: rewards.coins_earned,
    xp_earned: rewards.xp_earned - rewards.streak_bonus - rewards.time_bonus,
    coins_earned: rewards.coins_earned,
    time_bonus: rewards.time_bonus,
    streak_bonus: rewards.streak_bonus,
    metadata: {
      base_reward: rewards.xp_earned - rewards.streak_bonus - rewards.time_bonus,
      time_bonus: rewards.time_bonus,
      streak_bonus: rewards.streak_bonus,
      difficulty_bonus: Math.floor((difficultyMultiplier - 1) * 100),
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