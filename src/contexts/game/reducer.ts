import type { GameState, GameAction } from './types';
import { handleBattleStateUpdate } from './battle';
import { handleQuestAction } from './questReducer';
import { BATTLE_CONFIG } from '../../config/battleConfig';
import type { BattleStatus, BotOpponent } from '../../types/battle';

const initialBattleState = {
  status: 'idle' as BattleStatus,
  questions: [],
  current_question: 0,
  score: { player: 0, opponent: 0 },
  player_answers: [],
  time_per_question: BATTLE_CONFIG.time_per_question,
  time_left: BATTLE_CONFIG.time_per_question,
  in_progress: false,
  opponent: null as BotOpponent | null,
  rewards: {
    xp_earned: 0,
    coins_earned: 0,
    streak_bonus: 0,
    time_bonus: 0
  },
  metadata: {
    is_bot: false
  },
  error: {
    message: '',
    timestamp: 0
  }
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        syncing: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        battle: {
          ...(state.battle || initialBattleState),
          error: {
            message: action.payload,
            timestamp: Date.now()
          }
        }
      };

    case 'INITIALIZE_USER':
      return {
        ...state,
        user: action.payload as GameState['user'],
        syncing: false
      };

    case 'UPDATE_USER_PROFILE':
      return {
        ...state,
        user: {
          ...state.user,
          ...(action.payload as Partial<GameState['user']>)
        }
      };

    case 'ADD_XP': {
      const xpGain = action.payload;
      return {
        ...state,
        user: {
          ...state.user,
          xp: state.user.xp + xpGain.amount
        },
        recentXPGains: [
          ...state.recentXPGains,
          xpGain
        ].slice(-5)
      };
    }

    case 'ADD_COINS':
      return {
        ...state,
        user: {
          ...state.user,
          coins: state.user.coins + (action.payload as { amount: number }).amount
        }
      };

    case 'INITIALIZE_BATTLE':
    case 'ANSWER_QUESTION':
    case 'END_BATTLE':
      return {
        ...state,
        battle: handleBattleStateUpdate(state.battle || initialBattleState, action)
      };

    case 'RESET_BATTLE':
      return {
        ...state,
        battle: initialBattleState
      };

    case 'COMPLETE_QUEST':
    case 'UPDATE_QUESTS': {
      const questUpdates = handleQuestAction(state, action);
      return {
        ...state,
        quests: questUpdates.quests ?? state.quests,
        user: questUpdates.user ? {
          ...state.user,
          ...questUpdates.user
        } : state.user
      };
    }

    case 'UNLOCK_ACHIEVEMENT': {
      const achievement = action.payload;
      return {
        ...state,
        achievements: [
          ...state.achievements,
          achievement
        ]
      };
    }

    case 'UPDATE_INVENTORY':
      return {
        ...state,
        items: action.payload
      };

    case 'UPDATE_USER_PROGRESS':
      return {
        ...state,
        user: {
          ...state.user,
          xp: action.payload.xp,
          level: action.payload.level,
          coins: action.payload.coins,
          streak: action.payload.streak,
        }
      };

    case 'UPDATE_USER_PROGRESS':
      return {
        ...state,
        user: {
          ...state.user,
          xp: action.payload.xp,
          level: action.payload.level,
          coins: action.payload.coins,
          streak: action.payload.streak,
        }
      };

    default:
      return state;
  }
};
