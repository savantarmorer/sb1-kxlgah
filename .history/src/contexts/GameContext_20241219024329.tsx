import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { gameReducer } from './game/reducer';
import type { GameState } from '../types/game';
import type { GameAction } from './game/types';
import type { BattleQuestion, BattleStatus } from '../types/battle';
import { initialGameState } from './game/initialState';
import { AUTH_STATE_CHANGE } from './AuthContext';
import type { User } from '../types/user';
import { BattleService } from '../services/battleService';

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  loading: boolean;
  initialized: boolean;
  getCurrentQuestion: () => BattleQuestion | null;
  getBattleStatus: () => BattleStatus;
  getBattleProgress: () => {
    currentQuestion: number;
    totalQuestions: number;
    timeLeft: number;
    score: { player: number; opponent: number };
  };
  getRewards: () => {
    xpEarned: number;
    coinsEarned: number;
    streak_bonus: number;
    timeBonus: number;
  };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Listen for auth state changes and initialize game state
  useEffect(() => {
    const handleAuthStateChange = async (event: Event) => {
      const customEvent = event as CustomEvent<User | null>;
      setLoading(true);

      try {
        if (customEvent.detail) {
          // First set the user in game state
          dispatch({ type: 'SET_USER', payload: customEvent.detail });

          // Then fetch and initialize the complete game state
          const gameState = await BattleService.getCurrentGameState(customEvent.detail.id);
          dispatch({ type: 'INITIALIZE_USER', payload: gameState.user });
          
          if (gameState.battle_stats) {
            dispatch({ 
              type: 'UPDATE_BATTLE_STATS', 
              payload: gameState.battle_stats 
            });
          }
        } else {
          dispatch({ type: 'RESET_GAME_STATE' });
        }
      } catch (error) {
        console.error('Error initializing game state:', error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'Failed to initialize game state' 
        });
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    };

    window.addEventListener(AUTH_STATE_CHANGE, handleAuthStateChange);
    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE, handleAuthStateChange);
    };
  }, []);

  const getCurrentQuestion = (): BattleQuestion | null => {
    if (!state.battle?.questions || state.battle.current_question >= state.battle.questions.length) {
      return null;
    }
    return state.battle.questions[state.battle.current_question];
  };

  const getBattleStatus = (): BattleStatus => {
    return state.battle?.status || 'idle';
  };

  const getBattleProgress = () => {
    return {
      currentQuestion: state.battle?.current_question || 0,
      totalQuestions: state.battle?.questions?.length || 0,
      timeLeft: state.battle?.time_left || 0,
      score: state.battle?.score || { player: 0, opponent: 0 }
    };
  };

  const getRewards = () => {
    const rewards = state.battle?.rewards || {
      xp_earned: 0,
      coins_earned: 0,
      streak_bonus: 0,
      time_bonus: 0
    };
    return {
      xpEarned: rewards.xp_earned,
      coinsEarned: rewards.coins_earned,
      streak_bonus: rewards.streak_bonus,
      timeBonus: rewards.time_bonus
    };
  };

  const value: GameContextType = {
    state,
    dispatch,
    loading,
    initialized,
    getCurrentQuestion,
    getBattleStatus,
    getBattleProgress,
    getRewards
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};