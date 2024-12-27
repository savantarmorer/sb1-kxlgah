/**
 * Battle system configuration aligned with database schema
 */
export const BATTLE_CONFIG = {
  // Battle structure (battle_questions table)
  questions_per_battle: 7, // Matches total number of cards
  points_per_question: 10,
  
  // Time settings
  question_time: 30, // seconds
  time_per_question: 30, // seconds (alias for question_time for backwards compatibility)
  card_selection_time: 10, // seconds for card selection phase
  ready_time: 3,
  search_time: 2,

  // Card system configuration
  cards: {
    total_cards: 7,
    ataque: 2,
    defesa: 2,
    contra_ataque: 2,
    wildcard: 1,
    animation_duration: 1000, // ms
    flip_animation_duration: 500 // ms
  },
  
  // Combat configuration
  combat: {
    base_damage: 20,
    base_shield: 15,
    counter_multiplier: 1.5,
    wildcard_bonus: 1.2,
    both_wrong_damage: 10
  },
  
  // XP and Progress (user_progress & battle_history tables)
  progress: {
    base_xp: 100,
    base_coins: 50,
    max_level: 100,
    growth_factor: 1.5,
    streak_multiplier: 0.2,
    max_daily_battles: 20,
    wildcard_bonus: {
      xp: 20,
      coins: 10
    }
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
    },
    card_bonus: {
      effective_use: 10,
      wildcard_success: 20
    }
  },

  // Bot configuration (profiles & battle_ratings tables)
  bot: {
    base_rating: 1000,
    rating_multiplier: 100,
    base_accuracy: 0.5,
    accuracy_multiplier: 0.1,
    min_response_time: 1000,
    max_response_time: 5000,
    card_selection: {
      strategic_weight: 0.7,
      random_weight: 0.3
    }
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