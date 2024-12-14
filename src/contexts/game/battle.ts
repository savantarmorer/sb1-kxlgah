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
          status: 'error',
          error: {
            message: 'Cannot start battle: No questions available',
            timestamp: Date.now()
          }
        };
      }
      
      return {
        ...initialBattleState,
        status: 'preparing',
        current_question: 0,
        total_questions: payload.questions.length,
        questions: payload.questions,
        score: { player: 0, opponent: 0 },
        player_answers: [],
        time_left: payload.time_per_question || BATTLE_CONFIG.time_per_question,
        time_per_question: payload.time_per_question || BATTLE_CONFIG.time_per_question,
        opponent: payload.opponent || null,
        in_progress: true,
        metadata: {
          is_bot: Boolean(payload.opponent?.is_bot),
          difficulty: Number(payload.difficulty || 1)
        },
        error: null
      };

    case 'SET_BATTLE_STATUS':
      // Validate state transitions
      if (action.payload === 'active') {
        if (!battleState.questions || battleState.questions.length === 0) {
          return {
            ...battleState,
            status: 'error',
            error: {
              message: 'Cannot start battle: No questions available',
              timestamp: Date.now()
            }
          };
        }
      }
      
      return {
        ...battleState,
        status: action.payload,
        time_left: action.payload === 'active' 
          ? (battleState.time_left || BATTLE_CONFIG.time_per_question)
          : battleState.time_left,
        in_progress: action.payload !== 'completed' && 
                    action.payload !== 'victory' && 
                    action.payload !== 'defeat' && 
                    action.payload !== 'error'
      };

    case 'ANSWER_QUESTION': {
      if (!battleState.score) {
        return {
          ...battleState,
          status: 'error',
          error: {
            message: 'Invalid battle state: No score available',
            timestamp: Date.now()
          }
        };
      }

      const totalQuestions = battleState.questions.length;
      const isLastQuestion = battleState.current_question === totalQuestions - 1;
      const newAnswers = [...battleState.player_answers, action.payload.is_correct];
      const newScore = {
        player: action.payload.is_correct ? battleState.score.player + 1 : battleState.score.player,
        opponent: battleState.score.opponent
      };

      return {
        ...battleState,
        current_question: isLastQuestion ? battleState.current_question : battleState.current_question + 1,
        player_answers: newAnswers,
        score: newScore,
        status: isLastQuestion ? 'completed' : battleState.status,
        in_progress: !isLastQuestion
      };
    }

    case 'END_BATTLE':
      if (!battleState.score) {
        return {
          ...battleState,
          status: 'error',
          error: {
            message: 'Cannot end battle: No score available',
            timestamp: Date.now()
          }
        };
      }

      const { player, opponent } = battleState.score;
      let finalStatus: BattleStatus = 'completed';
      if (player > opponent) finalStatus = 'victory';
      else if (opponent > player) finalStatus = 'defeat';
      else finalStatus = 'draw';

      // Ensure rewards are properly formatted numbers
      const formattedRewards = {
        xp_earned: Number(action.payload.rewards?.xp_earned || 0),
        coins_earned: Number(action.payload.rewards?.coins_earned || 0),
        streak_bonus: Number(action.payload.rewards?.streak_bonus || 0),
        time_bonus: Number(action.payload.rewards?.time_bonus || 0)
      };

      return {
        ...battleState,
        status: finalStatus,
        rewards: formattedRewards,
        in_progress: false,
        error: null
      };

    case 'RESET_BATTLE':
      return initialBattleState;

    default:
      return battleState;
  }
};
