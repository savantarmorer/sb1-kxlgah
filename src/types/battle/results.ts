export interface BattleResults {
  isVictory: boolean;
  experience_gained: number;
  coinsEarned: number;
  streak_bonus: number;
  totalScore: number;
  rewards?: {
    items?: string[];
    achievements?: string[];
    bonuses?: {
      type: string;
      amount: number;
    }[];
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