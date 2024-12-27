/**
 * Battle system configuration aligned with database schema
 */
export const BATTLE_CONFIG = {
  // Battle structure (battle_questions table)
  questions_per_battle: 5,
  points_per_question: 10,
  
  // Time settings
  question_time: 30, // seconds
  time_per_question: 30, // seconds (alias for question_time for backwards compatibility)
  ready_time: 3,
  search_time: 2,
  initial_health: 100,
  
  // XP and Progress (user_progress & battle_history tables)
  progress: {
    xp_per_level: 1000,
    coins_per_level: 100,
    base_xp: 100,
    base_coins: 10
  },

  // Battle rewards (battle_history table)
  rewards: {
    victory: {
      xp: 500,
      coins: 50
    },
    defeat: {
      xp: 100,
      coins: 10
    }
  },

  // Bot configuration (profiles & battle_ratings tables)
  bot: {
    base_rating: 1000,
    rating_range: 200,
    min_level: 1,
    max_level: 10
  },

  // Matchmaking (battle_ratings table)
  matchmaking: {
    rating_range: 200,
    timeout: 30000,
    retry_interval: 5000
  }
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
 * - Matchmaking parameters
 */

export function calculate_streak_bonus(streak: number): number {
  return Math.min(
    streak * BATTLE_CONFIG.rewards.streak_bonus.multiplier,
    BATTLE_CONFIG.rewards.streak_bonus.max_bonus
  );
}

export function calculate_battle_rewards(score: number, streak: number) {
  const base_xp = score * BATTLE_CONFIG.progress.base_xp;
  const base_coins = score * BATTLE_CONFIG.progress.base_coins;
  const streak_bonus = calculate_streak_bonus(streak);

  return {
    xp: base_xp + streak_bonus,
    coins: base_coins + Math.floor(streak_bonus / 2)
  };
}