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
  
  // XP and Progress (user_progress & battle_history tables)
  progress: {
    base_xp: 100,
    base_coins: 50,
    max_level: 100,
    growth_factor: 1.5,
    streak_multiplier: 0.2,
    max_daily_battles: 20
  },

  // Battle rewards (battle_history table)
  rewards: {
    base_xp: 100,
    base_coins: 50,
    time_bonus: {
      multiplier: 0.5,
      max_bonus: 100
    },
    streak_bonus: {
      multiplier: 0.2,
      max_bonus: 200
    },
    victory_bonus: {
      xp_multiplier: 2.0,
      coins_multiplier: 1.8
    }
  },

  // Bot configuration (profiles & battle_ratings tables)
  bot: {
    base_rating: 1000,
    rating_multiplier: 100,
    base_accuracy: 0.5,
    accuracy_multiplier: 0.1,
    min_response_time: 1000,
    max_response_time: 5000
  },

  // Matchmaking (battle_ratings table)
  matchmaking: {
    k_factor: 32,
    default_rating: 1000,
    victory_threshold: 70
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