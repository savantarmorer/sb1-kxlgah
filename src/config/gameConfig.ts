/**
 * Core game configuration
 * Central source for game balance and settings
 */
export const GameConfig = {
  // Level system configuration
  level: {
    base_xp: 100,
    growth_factor: 1.5,
    max_level: 100,
    bonusPerLevel: 50
  },

  // Reward configuration
  rewards: {
    coinsPerLevel: 100,
    streak_bonus: {
      multiplier: 0.1,
      max_bonus: 100
    },
    dailyReward: {
      base_coins: 50,
      base_xp: 25,
      streakMultiplier: 0.2
    }
  },

  // Battle configuration
  battle: {
    time_per_question: 30,
    readyTime: 3,
    searchTime: 2,
    rewards: {
      base_xp: 50,
      base_coins: 20,
      streakMultiplier: 0.1
    },
    time_bonus_factor: 1.0  // Time bonus multiplier for quick answers
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