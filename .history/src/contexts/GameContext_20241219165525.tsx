import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { gameReducer } from './game/reducer';
import type { GameState } from '../types/game';
import type { GameAction } from './game/types';
import type { BattleQuestion, BattleStatus, BattleRewards } from '../types/battle';
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
  getRewards: () => BattleRewards;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const createGameValue = (
  state: GameState,
  dispatch: React.Dispatch<GameAction>,
  loading: boolean,
  initialized: boolean,
  getCurrentQuestion: () => BattleQuestion | null,
  getBattleStatus: () => BattleStatus,
  getBattleProgress: () => {
    currentQuestion: number;
    totalQuestions: number;
    timeLeft: number;
    score: { player: number; opponent: number };
  },
  getRewards: () => BattleRewards
): GameContextType => ({
  state,
  dispatch,
  loading,
  initialized,
  getCurrentQuestion,
  getBattleStatus,
  getBattleProgress,
  getRewards
});

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initialize game state from local storage if available
  useEffect(() => {
    const initializeFromStorage = () => {
      const savedState = localStorage.getItem('gameState');
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          if (parsedState.user) {
            dispatch({ type: 'INITIALIZE_USER', payload: parsedState.user });
            
            if (parsedState.battle) {
              dispatch({ type: 'UPDATE_BATTLE_PROGRESS', payload: parsedState.battle });
            }
            
            if (parsedState.statistics) {
              dispatch({ type: 'UPDATE_USER_PROGRESS', payload: parsedState.statistics });
            }
            
            if (parsedState.inventory) {
              dispatch({ type: 'UPDATE_INVENTORY', payload: { items: parsedState.inventory.items || [] } });
            }
          }
        } catch (error) {
          console.error('[GameContext] Failed to restore game state:', error);
        }
      }
      setLoading(false);
    };

    initializeFromStorage();
  }, []);

  // Save state to local storage when it changes
  useEffect(() => {
    if (!loading && state.user) {
      localStorage.setItem('gameState', JSON.stringify({
        user: state.user,
        battle: state.battle,
        statistics: state.statistics,
        inventory: state.inventory
      }));
    }
  }, [state, loading]);

  // Listen for auth state changes and initialize game state
  useEffect(() => {
    const handleAuthStateChange = async (event: Event) => {
      const customEvent = event as CustomEvent<User | null>;
      setLoading(true);

      try {
        if (customEvent.detail) {
          console.debug('[GameContext] Auth state changed, initializing game state for user:', customEvent.detail.id);
          
          // Initialize user with basic data first
          dispatch({ type: 'INITIALIZE_USER', payload: customEvent.detail });

          // Then fetch and initialize the complete game state
          const gameState = await BattleService.getCurrentGameState(customEvent.detail.id);
          
          if (gameState) {
            console.debug('[GameContext] Game state fetched:', gameState);

            // Update user state with complete profile data
            if (gameState.user) {
              dispatch({ type: 'UPDATE_USER_PROFILE', payload: gameState.user });
            }

            // Update battle progress if available
            if (gameState.battle) {
              dispatch({ type: 'UPDATE_BATTLE_PROGRESS', payload: gameState.battle });
            }

            // Update inventory if available
            if (gameState.inventory) {
              dispatch({
                type: 'UPDATE_INVENTORY',
                payload: { items: gameState.inventory.items || [] }
              });
            }

            // Update user progress if available
            if (gameState.statistics) {
              dispatch({
                type: 'UPDATE_USER_PROGRESS',
                payload: gameState.statistics
              });
            }

            setInitialized(true);
          }
        } else {
          // User logged out or no user, reset to initial state
          console.debug('[GameContext] No user, resetting to initial state');
          dispatch({ type: 'RESET_BATTLE' });
          localStorage.removeItem('gameState');
        }
      } catch (error) {
        console.error('[GameContext] Error initializing game state:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize game state' });
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener(AUTH_STATE_CHANGE, handleAuthStateChange);
    return () => window.removeEventListener(AUTH_STATE_CHANGE, handleAuthStateChange);
  }, []);

  const getCurrentQuestion = (): BattleQuestion | null => {
    if (!state.battle?.questions?.length) return null;
    return state.battle.questions[state.battle.current_question] || null;
  };

  const getBattleStatus = (): BattleStatus => {
    return state.battle?.status || 'idle';
  };

  const getBattleProgress = () => {
    return {
      currentQuestion: state.battle?.current_question + 1 || 0,
      totalQuestions: state.battle?.questions?.length || 0,
      timeLeft: state.battle?.time_left || 0,
      score: {
        player: state.battle?.score?.player || 0,
        opponent: state.battle?.score?.opponent || 0
      }
    };
  };

  const getRewards = (): BattleRewards => {
    return state.battle?.rewards || { xp: 0, coins: 0, items: [] };
  };

  // Don't render children until initial state is loaded
  if (loading && !initialized) {
    return null; // Or a loading spinner component
  }

  const value = createGameValue(
    state,
    dispatch,
    loading,
    initialized,
    getCurrentQuestion,
    getBattleStatus,
    getBattleProgress,
    getRewards
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};