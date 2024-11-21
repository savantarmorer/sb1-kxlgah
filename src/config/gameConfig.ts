/**
 * Core game configuration
 * Central source for game balance and settings
 */
export const GameConfig = {
  // Level system configuration
  level: {
    baseXP: 100,
    growthFactor: 1.5,
    maxLevel: 100,
    bonusPerLevel: 50
  },

  // Reward configuration
  rewards: {
    coinsPerLevel: 100,
    streakBonus: {
      multiplier: 0.1,
      maxBonus: 100
    },
    dailyReward: {
      baseCoins: 50,
      baseXP: 25,
      streakMultiplier: 0.2
    }
  },

  // Battle configuration
  battle: {
    questionTime: 30,
    readyTime: 3,
    searchTime: 2,
    rewards: {
      baseXP: 50,
      baseCoins: 20,
      streakMultiplier: 0.1
    }
  },

  // Quest configuration
  quests: {
    maxDaily: 3,
    maxWeekly: 7,
    refreshTime: '00:00',
    minReward: {
      xp: 50,
      coins: 25
    }
  }
} as const;

/**
 * Module Role:
 * - Central configuration
 * - Game balance settings
 * - System parameters
 * 
 * Dependencies:
 * - None (pure configuration)
 * 
 * Used By:
 * - Level system
 * - Battle system
 * - Quest system
 * - Reward system
 * 
 * Features:
 * - Type-safe constants
 * - Centralized settings
 * - Easy to modify
 * 
 * Scalability:
 * - Environment-aware
 * - Easy to extend
 * - Modular organization
 */ 