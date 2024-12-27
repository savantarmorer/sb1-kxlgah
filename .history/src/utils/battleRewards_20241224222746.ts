interface BattleRewards {
  total_xp: number;
  total_coins: number;
  metadata: {
    base_reward: number;
    time_bonus: number;
    streak_bonus: number;
    difficulty_bonus: number;
    damage_dealt?: number;
    damage_taken?: number;
    shield_gained?: number;
  };
}

export function calculateBattleRewards(
  isCorrect: boolean,
  timeLeft: number,
  streak: number,
  difficulty: string
): BattleRewards {
  // Base reward for correct answer
  const baseReward = isCorrect ? 100 : 0;

  // Time bonus (up to 100% based on time remaining)
  const timeBonus = Math.max(0, Math.ceil((timeLeft / 30) * 100));

  // Streak bonus (10% per streak, minimum 0)
  const streakBonus = Math.max(0, streak * 10);

  // Difficulty bonus
  let difficultyBonus = 0;
  switch (difficulty.toLowerCase()) {
    case 'easy':
      difficultyBonus = 0;
      break;
    case 'medium':
      difficultyBonus = 25;
      break;
    case 'hard':
      difficultyBonus = 50;
      break;
    default:
      difficultyBonus = 0;
  }

  // Calculate total XP with all bonuses
  const bonusMultiplier = 1 + (timeBonus + streakBonus + difficultyBonus) / 100;
  const totalXP = Math.ceil(baseReward * bonusMultiplier);

  // Coins are half of XP
  const totalCoins = Math.ceil(totalXP / 2);

  return {
    total_xp: totalXP,
    total_coins: totalCoins,
    metadata: {
      base_reward: baseReward,
      time_bonus: timeBonus,
      streak_bonus: streakBonus,
      difficulty_bonus: difficultyBonus
    }
  };
} 