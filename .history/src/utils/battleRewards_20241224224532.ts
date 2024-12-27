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

  // Base rewards
  const baseReward = 150;

  // Calculate time bonus (up to 50% bonus)
  const timeBonus = Math.ceil((timeLeft / 30) * 50);

  // Calculate streak bonus (10% per streak, capped at 100%)
  const streakBonus = Math.min(streak * 10, 100);

  // Calculate difficulty bonus
  const difficultyBonus = difficulty === 'medium' ? 25 : (difficulty === 'hard' ? 50 : 0);

  // Calculate total multiplier
  const totalMultiplier = 1 + ((timeBonus + streakBonus + difficultyBonus) / 100);

  // Calculate final rewards
  const totalXP = Math.ceil(baseReward * totalMultiplier);
  const totalCoins = Math.floor(totalXP / 2);

  return {
    total_xp: totalXP,
    total_coins: totalCoins,
    xp_earned: baseReward,
    coins_earned: Math.floor(baseReward / 2),
    time_bonus: timeBonus,
    streak_bonus: streakBonus,
    metadata: {
      base_reward: baseReward,
      time_bonus: timeBonus,
      streak_bonus: streakBonus,
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