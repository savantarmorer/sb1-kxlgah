import type { GameState } from '../../types/game';
import type { GameAction } from './types';
import type { BattleStatus } from '../../types/battle';
import { BATTLE_CONFIG } from '../../config/battleConfig';
import { BattleStateEnum } from '../../types/battle';

const initialBattleState = {
  status: BattleStateEnum.IDLE,
  score: { player: 0, opponent: 0 },
  player_role: null,
  opponent_role: null,
  current_round: 0,
  total_rounds: 5,
  last_played_cards: null,
  in_progress: false,
  error: null,
  rewards: {
    xp_earned: 0,
    coins_earned: 0,
    streak_bonus: 0,
    time_bonus: 0
  },
  metadata: {
    is_bot: true,
    difficulty: 1,
    game_mode: 'cards'
  }
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'INITIALIZE_USER':
      return {
        ...state,
        user: action.payload,
        loading: false
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };

    case 'UPDATE_USER_PROFILE':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload
        }
      };

    case 'ADD_XP':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          xp: state.user.xp + action.payload.amount
        }
      };

    case 'ADD_COINS':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          coins: state.user.coins + action.payload.amount
        }
      };

    case 'INITIALIZE_BATTLE':
      if (!state.user) return state;
      return {
        ...state,
        battle: {
          ...initialBattleState,
          status: BattleStateEnum.PREPARING,
          player_role: action.payload.player_role,
          opponent_role: action.payload.player_role === 'promotoria' ? 'defesa' : 'promotoria',
          opponent: action.payload.opponent,
          metadata: {
            ...initialBattleState.metadata,
            is_bot: action.payload.opponent?.is_bot ?? true,
            difficulty: action.payload.opponent?.difficulty || 1,
            game_mode: 'cards'
          }
        }
      };

    case 'ANSWER_QUESTION':
      if (!state.battle || !state.user) return state;
      return {
        ...state,
        battle: {
          ...state.battle,
          player_answers: [...state.battle.player_answers, action.payload.is_correct],
          score: {
            ...state.battle.score,
            player: state.battle.score.player + (action.payload.is_correct ? 1 : 0)
          },
          current_question: state.battle.current_question + 1
        }
      };

    case 'END_BATTLE':
      if (!state.battle || !state.user) return state;
      return {
        ...state,
        battle: {
          ...state.battle,
          status: action.payload.status || 'completed',
          score: action.payload.score,
          rewards: action.payload.rewards
        }
      };

    case 'RESET_BATTLE':
      return {
        ...state,
        battle: initialBattleState
      };

    case 'SET_BATTLE_STATUS':
      if (!state.battle || !state.user) return state;
      return {
        ...state,
        battle: {
          ...state.battle,
          status: action.payload
        }
      };

    case 'SET_BATTLE_PHASE':
      return {
        ...state,
        battle: {
          ...state.battle,
          phase: action.payload
        }
      };

    case 'UPDATE_BATTLE_PROGRESS':
      if (!state.battle || !state.user) return state;
      
      // Handle card play
      if (action.payload.playerCard && action.payload.opponentCard) {
        const { playerCard, opponentCard, score } = action.payload;
        
        return {
          ...state,
          battle: {
            ...state.battle,
            score: score || state.battle.score,
            current_round: state.battle.current_round + 1,
            last_played_cards: {
              player: playerCard,
              opponent: opponentCard
            },
            status: score?.player >= 3 || score?.opponent >= 3 
              ? BattleStateEnum.COMPLETED 
              : BattleStateEnum.CARD_SELECTION
          }
        };
      }
      
      return {
        ...state,
        battle: {
          ...state.battle,
          ...action.payload
        }
      };

    case 'UPDATE_USER_PROGRESS':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          xp: action.payload.xp,
          coins: action.payload.coins,
          level: action.payload.level,
          streak: action.payload.streak
        },
        statistics: {
          ...state.statistics,
          total_xp: action.payload.xp,
          total_coins: action.payload.coins
        }
      };

    case 'UNLOCK_ACHIEVEMENTS':
      if (!state.user) return state;
      
      // Create a map of existing achievements by ID
      const existingAchievements = new Map(
        (state.achievements || []).map(achievement => [achievement.id, achievement])
      );
      
      // Update or add new achievements
      action.payload.forEach(achievement => {
        if (achievement && achievement.id) {
          existingAchievements.set(achievement.id, {
            ...existingAchievements.get(achievement.id),
            ...achievement
          });
        }
      });
      
      return {
        ...state,
        achievements: Array.from(existingAchievements.values())
      };

    case 'UPDATE_QUESTS':
      if (!state.user) return state;
      return {
        ...state,
        quests: {
          active: action.payload.active,
          completed: action.payload.completed
        }
      };

    case 'UPDATE_INVENTORY':
      if (!state.user) return state;
      return {
        ...state,
        inventory: {
          items: action.payload.items.filter(item => item.quantity > 0),
          equipped: action.payload.equipped || []
        }
      };

    case 'UPDATE_BATTLE_QUESTION':
      if (!state.battle || !state.user) return state;
      return {
        ...state,
        battle: {
          ...state.battle,
          questions: state.battle.questions.map((q, index) => 
            index === state.battle.current_question ? action.payload.question : q
          )
        }
      };

    default:
      return state;
  }
};
