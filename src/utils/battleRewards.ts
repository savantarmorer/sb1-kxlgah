import { LevelSystem } from '../lib/levelSystem';
import type { XPGain } from '../types/progression';
import type { BattleRewards, Card } from '../types/battle';

export function calculateBattleRewards(
  isCorrect: boolean,
  timeLeft: number,
  streak: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  playerCard?: Card,
  opponentCard?: Card
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

  // Calculate card effects
  const cardDamageBonus = playerCard?.attack || 0;
  const cardDefenseBonus = playerCard?.defense || 0;
  const opponentDefense = opponentCard?.defense || 0;

  // Calculate effective damage
  const baseDamage = 10;
  const effectiveDamage = Math.max(0, baseDamage + cardDamageBonus - opponentDefense);
  const shieldGained = cardDefenseBonus;

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
      damage_dealt: effectiveDamage,
      damage_taken: isCorrect ? 0 : 5,
      shield_gained: shieldGained
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
    multiplier: 1 + ((rewards.metadata?.difficulty_bonus || 0) / 100),
    details: {
      battleId
    }
  };
} 