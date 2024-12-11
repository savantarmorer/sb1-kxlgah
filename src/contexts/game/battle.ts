import type { GameAction } from './types';
import { BattleState, BattleStatus, initialBattleState, BattleInitPayload } from '../../types/battle';
import { BATTLE_CONFIG } from '../../config/battleConfig';

/**
 * Handles battle state updates with optimized performance
 */
export const handleBattleStateUpdate = (
  battleState: BattleState,
  action: GameAction
): BattleState => {
  switch (action.type) {
    case 'INITIALIZE_BATTLE':
      const payload = action.payload as BattleInitPayload;
      if (!payload.questions || payload.questions.length === 0) {
        return {
          ...initialBattleState,
          status: 'error'
        };
      }
      
      return {
        ...battleState,
        status: 'preparing',
        current_question: 0,
        total_questions: payload.questions.length,
        questions: payload.questions,
        score: { player: 0, opponent: 0 },
        player_answers: [],
        time_left: payload.time_per_question || BATTLE_CONFIG.time_per_question,
        opponent: payload.opponent || null
      };

    case 'SET_BATTLE_STATUS':
      // Validate state transitions
      if (action.payload === 'active') {
        if (!battleState.questions || battleState.questions.length === 0) {
          console.error('Cannot transition to active: No questions available');
          return {
            ...battleState,
            status: 'error'
          };
        }
      }
      
      return {
        ...battleState,
        status: action.payload,
        time_left: action.payload === 'active' 
          ? (battleState.time_left || BATTLE_CONFIG.time_per_question)
          : battleState.time_left
      };

    case 'ANSWER_QUESTION': {
      const totalQuestions = battleState.total_questions || 0;
      const isLastQuestion = battleState.current_question === totalQuestions - 1;
      const newAnswers = [...battleState.player_answers, action.payload.is_correct];
      const newScore = {
        ...battleState.score,
        player: action.payload.is_correct ? battleState.score.player + 1 : battleState.score.player
      };

      return {
        ...battleState,
        current_question: isLastQuestion ? battleState.current_question : battleState.current_question + 1,
        player_answers: newAnswers,
        score: newScore,
        status: isLastQuestion ? 'completed' : battleState.status
      };
    }

    case 'END_BATTLE':
      const { player, opponent } = battleState.score;
      let finalStatus: BattleStatus = 'completed';
      if (player > opponent) finalStatus = 'victory';
      else if (opponent > player) finalStatus = 'defeat';
      else finalStatus = 'draw';

      return {
        ...battleState,
        status: finalStatus,
        rewards: action.payload.rewards
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
