import type { GameAction } from './types';
import { BattleState, BattleStatus, initialBattleState, BattleInitPayload, BattleStateEnum } from '../../types/battle';
import { BATTLE_CONFIG } from '../../config/battleConfig';
import { calculateBattleResult } from '../../utils/cardUtils';

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
      return {
        ...initialBattleState,
        status: BattleStateEnum.PREPARING,
        player_role: payload.player_role || 'promotoria',
        opponent_role: payload.player_role === 'defesa' ? 'promotoria' : 'defesa',
        score: { player: 0, opponent: 0 },
        current_round: 1,
        total_rounds: 5,
        in_progress: true,
        metadata: {
          is_bot: Boolean(payload.opponent?.is_bot),
          game_mode: 'cards'
        },
        error: null
      };

    case 'PLAY_CARD':
      const { playerCard, opponentCard } = action.payload;
      const result = calculateBattleResult(playerCard, opponentCard);
      let newScore = { ...battleState.score };
      
      if (result.winner) {
        if (result.winner.type === battleState.player_role) {
          newScore.player += result.points;
        } else {
          newScore.opponent += result.points;
        }
      }

      // Check if someone reached 3 points
      const gameEnded = newScore.player >= 3 || newScore.opponent >= 3;
      const newStatus = gameEnded ? 
        (newScore.player >= 3 ? BattleStateEnum.VICTORY : BattleStateEnum.DEFEAT) :
        BattleStateEnum.CARD_SELECTION;

      return {
        ...battleState,
        score: newScore,
        current_round: gameEnded ? battleState.current_round : battleState.current_round + 1,
        status: newStatus,
        in_progress: !gameEnded,
        last_played_cards: {
          player: playerCard,
          opponent: opponentCard,
          result
        }
      };

    case 'SET_BATTLE_STATUS':
      return {
        ...battleState,
        status: action.payload as BattleStateEnum,
        phase: action.payload as BattleStateEnum,
        in_progress: action.payload !== BattleStateEnum.COMPLETED && 
                    action.payload !== BattleStateEnum.VICTORY && 
                    action.payload !== BattleStateEnum.DEFEAT && 
                    action.payload !== BattleStateEnum.ERROR
      };

    case 'END_BATTLE':
      if (!battleState.score) {
        return {
          ...battleState,
          status: BattleStateEnum.ERROR,
          error: {
            message: 'Cannot end battle: No score available',
            timestamp: Date.now()
          }
        };
      }

      const { player, opponent } = battleState.score;
      let finalStatus: BattleStatus = BattleStateEnum.COMPLETED;
      if (player >= 3) finalStatus = BattleStateEnum.VICTORY;
      else if (opponent >= 3) finalStatus = BattleStateEnum.DEFEAT;

      return {
        ...battleState,
        status: finalStatus,
        in_progress: false,
        error: null
      };

    case 'RESET_BATTLE':
      return initialBattleState;

    default:
      return battleState;
  }
};
