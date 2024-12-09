import type { GameAction } from './types';
import { BattleState, BattleStatus, initialBattleState } from '../../types/battle';

/**
 * Handles battle state updates with optimized performance
 */
export const handleBattleStateUpdate = (
  battleState: BattleState,
  action: GameAction
): BattleState => {
  switch (action.type) {
    case 'INITIALIZE_BATTLE':
      return {
        ...battleState,
        status: 'active',
        current_question: 0,
        score: { player: 0, opponent: 0 },
        player_answers: [],
        time_left: action.payload.time_per_question,
        opponent: action.payload.opponent,
        in_progress: true,
      };

    case 'ANSWER_QUESTION':
      // Handle question answer logic
      return battleState;

    case 'END_BATTLE':
      return {
        ...battleState,
        status: 'completed',
        in_progress: false,
        rewards: action.payload.rewards,
      };

    case 'RESET_BATTLE':
      return initialBattleState;

    default:
      return battleState;
  }
};

/**
 * Calculates rewards based on battle performance
 */
const calculateBattleRewards = (
  isWinner: boolean,
  turns: number
): { xp: number; coins: number } => {
  if (!isWinner) return { xp: 10, coins: 5 }; // Consolation reward
  
  // Base rewards
  const base_xp = 100;
  const base_coins = 50;
  
  // Turn multiplier (faster battles = better rewards)
  const turnMultiplier = Math.max(0.5, 2 - turns * 0.1);
  
  return {
    xp: Math.round(base_xp * turnMultiplier),
    coins: Math.round(base_coins * turnMultiplier)
  };
};
