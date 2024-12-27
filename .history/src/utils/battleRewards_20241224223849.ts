export interface BattleRewards {
  total_xp: number;
  total_coins: number;
  metadata: {
    base_reward: number;
    time_bonus: number;
    streak_bonus: number;
    difficulty_bonus: number;
  };
}

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

  // Base reward
  const base_reward = 150;

  // Time bonus calculation (0-50%)
  const time_bonus = timeLeft === 0 ? 0 : Math.max(Math.floor((timeLeft / 30) * 50), timeLeft < 10 ? 16 : 0);

  // Streak bonus (10% per streak, max 100%)
  const streak_bonus = Math.min(streak * 10, 100);

  // Difficulty bonus
  let difficulty_bonus = 25; // Default to medium
  if (difficulty === 'easy') difficulty_bonus = 0;
  else if (difficulty === 'hard') difficulty_bonus = 50;

  // Calculate total XP with bonuses (additive)
  const total_bonus_percentage = time_bonus + streak_bonus + difficulty_bonus;
  const total_xp = Math.floor(base_reward * (1 + total_bonus_percentage / 100));
  const total_coins = Math.floor(total_xp / 2);

  return {
    total_xp,
    total_coins,
    metadata: {
      base_reward,
      time_bonus,
      streak_bonus,
      difficulty_bonus
    }
  };
} 