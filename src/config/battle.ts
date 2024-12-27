export const BATTLE_CONFIG = {
  time_per_question: 30,
  questions_per_battle: 5,
  matchmaking: {
    default_rating: 1000,
    min_rating: 0,
    max_rating: 3000,
    rating_change: {
      win: 25,
      loss: -15
    }
  },
  bot: {
    base_accuracy: 0.7,
    accuracy_multiplier: 0.1,
    min_time: 5,
    max_time: 20
  },
  rewards: {
    base_xp: 100,
    base_coins: 50,
    streak_multiplier: 0.1,
    correct_answer_bonus: 10
  }
}; 