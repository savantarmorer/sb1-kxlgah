export interface BattleResults {
  victory: boolean;
  draw: boolean;
  score: {
    player: number;
    opponent: number;
  };
  rewards: {
    xp_earned: number;
    coins_earned: number;
    streak_bonus: number;
  };
  stats: {
    correct_answers: number;
    total_questions: number;
    time_taken: number;
    average_time: number;
  };
}

/**
 * Used by:
 * - BattleService.calculateResults
 * - BattleContext.endBattle
 * - GameReducer END_BATTLE action
 * 
 * Dependencies:
 * - Achievement system
 * - Reward system
 * - Battle scoring system
 * attle scoring system
 */ 