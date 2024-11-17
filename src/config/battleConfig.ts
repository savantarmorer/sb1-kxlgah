/**
 * Configuration for battle system
 * 
 * Used by:
 * - BattleService
 * - useBattle hook
 * - BattleMode component
 */
export const BATTLE_CONFIG = {
  // Time settings
  questionTime: 30, // seconds per question
  readyTime: 3, // seconds before battle starts
  searchTime: 2, // seconds to simulate search

  // Reward settings
  rewards: {
    baseXP: 50,
    baseCoins: 20,
    timeBonus: {
      multiplier: 0.5,
      maxBonus: 25
    },
    streakBonus: {
      multiplier: 0.1,
      maxBonus: 100
    },
    victoryBonus: {
      xp: 100,
      coins: 50
    }
  },

  // Difficulty settings
  difficulty: {
    easy: {
      timeMultiplier: 1.2,
      xpMultiplier: 0.8
    },
    medium: {
      timeMultiplier: 1.0,
      xpMultiplier: 1.0
    },
    hard: {
      timeMultiplier: 0.8,
      xpMultiplier: 1.5
    }
  },

  // Matchmaking settings
  matchmaking: {
    maxRatingDiff: 200,
    defaultRating: 1000,
    kFactor: 32
  }
} as const;

/**
 * Configuration Role:
 * - Central source of battle system constants
 * - Easy modification of game balance
 * - Type-safe configuration values
 * 
 * Scalability:
 * - Separated by concern (time, rewards, difficulty)
 * - Easily extensible
 * - Environment-aware (could add dev/prod configs)
 * 
 * Dependencies:
 * - None (pure configuration)
 * 
 * Used by:
 * - Battle service
 * - Battle components
 * - Admin configuration
 */ 