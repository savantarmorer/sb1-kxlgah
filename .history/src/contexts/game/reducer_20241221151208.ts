import type { GameState } from '../../types/game';
import type { GameAction } from './types';
import type { 
  BattleStatus, 
  BattlePhase, 
  BattlePlayerState, 
  BattleMetadata,
  BattleState,
  BattleQuestion,
  BattleOpponent
} from '../../types/battle';
import { BATTLE_CONFIG } from '../../config/battleConfig';

const initialBattleState: BattleState = {
  id: `battle_${Date.now()}`,
  status: 'idle',
  phase: 'idle',
  questions: [],
  current_question: 0,
  total_questions: 0,
  opponent: null,
  score: { player: 0, opponent: 0 },
  player_answers: [],
  time_per_question: BATTLE_CONFIG.time_per_question,
  time_left: BATTLE_CONFIG.time_per_question,
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
    mode: 'practice'
  },
  player_states: {},
  started_at: new Date().toISOString(),
  start_time: Date.now()
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
      const battleId = `battle_${Date.now()}`;
      const startTime = Date.now();
      const playerState: BattlePlayerState = {
        id: state.user.id,
        answered: false,
        answer: null,
        score: 0,
        correct_count: 0,
        time_bonus: 0
      };

      const battleMetadata: BattleMetadata = {
        is_bot: action.payload.opponent?.is_bot ?? true,
        difficulty: action.payload.opponent?.difficulty || 1,
        mode: (action.payload.metadata?.mode || 'practice') as BattleMetadata['mode']
      };

      return {
        ...state,
        battle: {
          ...initialBattleState,
          id: battleId,
          questions: action.payload.questions,
          total_questions: action.payload.questions.length,
          opponent: action.payload.opponent,
          time_per_question: action.payload.time_per_question || BATTLE_CONFIG.time_per_question,
          time_left: action.payload.time_per_question || BATTLE_CONFIG.time_per_question,
          status: 'active',
          score: { player: 0, opponent: 0 },
          phase: 'in_progress',
          started_at: new Date(startTime).toISOString(),
          start_time: startTime,
          player_states: {
            [state.user.id]: playerState
          },
          metadata: battleMetadata
        }
      };

    case 'ANSWER_QUESTION':
      if (!state.battle || !state.user) return state;
      const isLastQuestion = state.battle.current_question === state.battle.questions.length - 1;
      const newScore = {
        ...state.battle.score,
        player: state.battle.score.player + (action.payload.is_correct ? 1 : 0)
      };

      return {
        ...state,
        battle: {
          ...state.battle,
          player_answers: [...state.battle.player_answers, action.payload.is_correct],
          score: newScore,
          current_question: isLastQuestion ? state.battle.current_question : state.battle.current_question + 1,
          status: isLastQuestion ? 'completed' : state.battle.status,
          phase: isLastQuestion ? 'completed' : state.battle.phase,
          time_left: isLastQuestion ? 0 : state.battle.time_per_question
        }
      };

    case 'END_BATTLE':
      if (!state.battle || !state.user) return state;
      const finalStatus = action.payload.status || 
        (state.battle.score.player > state.battle.score.opponent ? 'victory' : 
         state.battle.score.player < state.battle.score.opponent ? 'defeat' : 'draw');

      return {
        ...state,
        battle: {
          ...state.battle,
          status: finalStatus,
          phase: 'completed',
          score: action.payload.score,
          rewards: {
            xp_earned: action.payload.rewards.xp_earned || 0,
            coins_earned: action.payload.rewards.coins_earned || 0,
            streak_bonus: action.payload.rewards.streak_bonus || 0,
            time_bonus: action.payload.rewards.time_bonus || 0
          },
          in_progress: false
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
          status: action.payload,
          phase: action.payload === 'active' ? 'in_progress' : state.battle.phase,
          in_progress: action.payload === 'active'
        }
      };

    case 'UPDATE_BATTLE_STATE':
      if (!state.battle || !state.user) return state;
      return {
        ...state,
        battle: {
          ...state.battle,
          ...action.payload.state
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

    default:
      return state;
  }
};
