/**
 * Battle system configuration
 */
export const BATTLE_CONFIG = {
  // Time settings
  questionTime: 30,
  readyTime: 3,
  searchTime: 2,
  timePerQuestion: 30,

  // Battle structure
  questionsPerBattle: 5,
  pointsPerQuestion: 10,

  // Reward configuration
  rewards: {
    baseXP: 50,
    baseCoins: 20,
    timeBonus: {
      multiplier: 0.5,
      maxBonus: 50
    },
    streakBonus: {
      multiplier: 0.1,
      maxBonus: 100
    },
    victoryBonus: {
      xpMultiplier: 1.5,
      coinsMultiplier: 1.5
    }
  },
  matchmaking: {
    kFactor: 32,
    defaultRating: 1000
  },
  victoryThreshold: 70
} as const;

/**
 * Dependencies:
 * - None (configuration only)
 * 
 * Used By:
 * - BattleContext
 * - BattleService
 * - Battle components
 * 
 * Features:
 * - Centralized battle configuration
 * - Timing controls
 * - Scoring system
 * - Reward calculations
 * 
 * Scalability:
 * - Easy to modify values
 * - Extensible structure
 * - Type-safe constants
 */

export const calculateStreakBonus = (streak: number): number => {
  if (streak <= 0) return 0;
  return Math.min(streak * BATTLE_CONFIG.rewards.streakBonus.multiplier, 
                 BATTLE_CONFIG.rewards.streakBonus.maxBonus);
};

export const calculateBattleRewards = (score: number, streak: number) => {
  const baseXP = BATTLE_CONFIG.rewards.baseXP * (score / 100);
  const baseCoins = BATTLE_CONFIG.rewards.baseCoins * (score / 100);
  const streakBonus = calculateStreakBonus(streak);

  return {
    xp: Math.round(baseXP * (1 + streakBonus)),
    coins: Math.round(baseCoins * (1 + streakBonus))
  };
}; 