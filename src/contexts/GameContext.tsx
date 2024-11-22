import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GameState } from '../types/game';
import { BattleState, BattleStatus } from '../types/battle';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { User } from '../types/user';
import { Achievement } from '../types/achievements';
import { Reward } from '../types/rewards';
import { BattleStats } from '../types/battle';
import { GameStatistics } from '../types/game';

type GameAction = 
  // Battle Actions
  | { type: 'SET_BATTLE_STATUS'; payload: BattleStatus }
  | { type: 'INITIALIZE_BATTLE'; payload: { questions: any[]; timePerQuestion: number } }
  | { type: 'UPDATE_BATTLE_PROGRESS'; payload: any }
  | { type: 'END_BATTLE'; payload: any }
  | { type: 'RESET_BATTLE' }
  // User Actions
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<User> }
  | { type: 'ADD_XP'; payload: number }
  | { type: 'ADD_COINS'; payload: number }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: Achievement }
  | { type: 'CLAIM_REWARD'; payload: Reward }
  | { type: 'UPDATE_USER_STATS'; payload: { xp: number; coins: number; streak: number } }
  | { type: 'UPDATE_BATTLE_STATS'; payload: Partial<BattleStats> }
  | { type: 'LEVEL_UP'; payload: { level: number; rewards: Reward[] } }
  | { type: 'SYNC_STATISTICS'; payload: GameStatistics }
  | { type: 'UPDATE_STREAK_MULTIPLIER' }
  | { type: 'COMPLETE_QUEST'; payload: { questId: string; rewards: Reward[] } };

const initialState: GameState = {
  user: {
    id: '',
    name: '',
    email: '',
    level: 1,
    xp: 0,
    coins: 0,
    streak: 0,
    battleRating: BATTLE_CONFIG.matchmaking.defaultRating,
    roles: ['user'],
    achievements: [],
    rewardMultipliers: {
      xp: 1,
      coins: 1
    },
    streakMultiplier: 1,
    title: ''
  },
  battle: {
    status: 'searching',
    inProgress: false,
    questions: [],
    currentQuestion: 0,
    score: { player: 0, opponent: 0 },
    timePerQuestion: BATTLE_CONFIG.timePerQuestion,
    playerAnswers: [],
    timeLeft: BATTLE_CONFIG.timePerQuestion
  },
  battleStats: {
    totalBattles: 0,
    wins: 0,
    losses: 0,
    winStreak: 0,
    highestStreak: 0,
    totalXpEarned: 0,
    totalCoinsEarned: 0,
    averageScore: 0,
    lastBattleDate: undefined
  },
  achievements: [],
  quests: [],
  completedQuests: [],
  items: [],
  loginHistory: [],
  recentXPGains: [],
  leaderboard: [], // Initialize empty leaderboard array
  statistics: {
    activeUsers: 0,
    completedQuests: 0,
    purchasedItems: 0,
    battlesPlayed: 0,
    battlesWon: 0,
    averageScore: 0,
    lastUpdated: new Date().toISOString(),
    recentActivity: []
  },
  syncing: false,
  debugMode: false
};

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth();
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Sync with database whenever relevant state changes
  useEffect(() => {
    if (state.user?.id) {
      updateUserProgress(state.user.id, {
        xp: state.user.xp,
        coins: state.user.coins,
        level: state.user.level,
        streak: state.user.streak,
        battleStats: state.battleStats
      });
    }
  }, [state.user?.xp, state.user?.coins, state.user?.level, state.user?.streak, state.battleStats]);

  const updateUserProgress = async (userId: string, progress: any) => {
    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          ...progress,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error updating user progress:', err);
    }
  };

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_BATTLE_STATUS':
      return {
        ...state,
        battle: {
          ...state.battle,
          status: action.payload,
          timeLeft: action.payload === 'battle' ? BATTLE_CONFIG.timePerQuestion : state.battle.timeLeft
        }
      };

    case 'INITIALIZE_BATTLE':
      return {
        ...state,
        battle: {
          ...state.battle,
          questions: action.payload.questions,
          timePerQuestion: action.payload.timePerQuestion,
          currentQuestion: 0,
          playerAnswers: [],
          score: { player: 0, opponent: 0 }
        }
      };

    case 'UPDATE_BATTLE_PROGRESS':
      return {
        ...state,
        battle: {
          ...state.battle,
          ...action.payload
        }
      };

    case 'END_BATTLE':
      return {
        ...state,
        battle: {
          ...state.battle,
          status: 'completed',
          rewards: action.payload
        }
      };

    case 'RESET_BATTLE':
      return {
        ...state,
        battle: {
          ...initialState.battle
        }
      };

    case 'UPDATE_USER_PROFILE':
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload
        }
      };

    case 'ADD_XP':
      return {
        ...state,
        user: {
          ...state.user,
          xp: state.user.xp + action.payload
        }
      };

    case 'ADD_COINS':
      return {
        ...state,
        user: {
          ...state.user,
          coins: state.user.coins + action.payload
        }
      };

    case 'UNLOCK_ACHIEVEMENT':
      return {
        ...state,
        achievements: [...state.achievements, action.payload]
      };

    case 'CLAIM_REWARD':
      return {
        ...state,
        user: {
          ...state.user,
          ...(action.payload.type === 'xp' && { xp: state.user.xp + Number(action.payload.value) }),
          ...(action.payload.type === 'coins' && { coins: state.user.coins + Number(action.payload.value) })
        }
      };

    case 'UPDATE_USER_STATS':
      return {
        ...state,
        user: {
          ...state.user,
          xp: state.user.xp + action.payload.xp,
          coins: state.user.coins + action.payload.coins,
          streak: action.payload.streak
        }
      };

    case 'UPDATE_BATTLE_STATS':
      return {
        ...state,
        battleStats: {
          ...state.battleStats,
          ...action.payload
        }
      };

    case 'LEVEL_UP':
      return {
        ...state,
        user: {
          ...state.user,
          level: action.payload.level,
          xp: state.user.xp + Number(action.payload.rewards[0].value),
          coins: state.user.coins + Number(action.payload.rewards[1].value)
        }
      };

    case 'SYNC_STATISTICS':
      return {
        ...state,
        statistics: {
          ...state.statistics,
          ...action.payload
        }
      };

    case 'UPDATE_STREAK_MULTIPLIER':
      return {
        ...state,
        user: {
          ...state.user,
          streakMultiplier: state.user.streakMultiplier + 1
        }
      };

    case 'COMPLETE_QUEST':
      return {
        ...state,
        completedQuests: [...state.completedQuests, action.payload.questId],
        user: {
          ...state.user,
          xp: state.user.xp + action.payload.rewards.reduce(
            (sum, r) => r.type === 'xp' ? sum + Number(r.value) : sum, 0
          ),
          coins: state.user.coins + action.payload.rewards.reduce(
            (sum, r) => r.type === 'coins' ? sum + Number(r.value) : sum, 0
          )
        }
      };

    default:
      return state;
  }
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}