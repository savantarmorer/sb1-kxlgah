export interface BattleRewards {
  xp_earned: number;
  coins_earned: number;
  streak_bonus: number;
  time_bonus: number;
}

export interface BattleResults {
  victory: boolean;
  draw: boolean;
  score: {
    player: number;
    opponent: number;
  };
  rewards: BattleRewards;
  stats: {
    correct_answers: number;
    total_questions: number;
    time_taken: number;
    average_time: number;
  };
}

export interface DBBattleResults {
  user_id: string;
  opponent_id: string | null;
  winner_id: string | null;
  score_player: number;
  score_opponent: number;
  is_bot_opponent: boolean;
  difficulty: number;
  created_at: string;
  rewards: BattleRewards;
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
 */ 