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
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: 'RESTORE_STATE', payload: parsedState });
      } catch (error) {
        console.error('Failed to restore game state:', error);
      }
    }
    setLoading(false);
  }, []);

  // Save state to local storage when it changes
  useEffect(() => {
    if (initialized && state.user) {
      localStorage.setItem('gameState', JSON.stringify(state));
    }
  }, [state, initialized]);

  // Listen for auth state changes and initialize game state
  useEffect(() => {
    const handleAuthStateChange = async (event: Event) => {
      const customEvent = event as CustomEvent<User | null>;
      setLoading(true);

      try {
        if (customEvent.detail) {
          console.debug('[GameContext] Auth state changed, initializing game state for user:', customEvent.detail.id);
          
          // Initialize user with basic data first
          dispatch({ 
            type: 'SET_USER', 
            payload: {
              ...customEvent.detail,
              battle_stats: {
                total_battles: 0,
                wins: 0,
                losses: 0,
                win_streak: 0,
                highest_streak: 0,
                total_xp_earned: 0,
                total_coins_earned: 0,
                difficulty: 1
              }
            }
          });

          // Then fetch and initialize the complete game state
          const gameState = await BattleService.getCurrentGameState(customEvent.detail.id);
          
          if (gameState) {
            console.debug('[GameContext] Game state fetched:', gameState);

            // Update user state with complete profile data
            if (gameState.user) {
              dispatch({ 
                type: 'UPDATE_USER_PROFILE', 
                payload: gameState.user
              });
            }

            // Update battle stats if available
            if (gameState.battle_stats) {
              dispatch({ 
                type: 'UPDATE_BATTLE_STATS', 
                payload: gameState.battle_stats 
              });
            }

            // Update inventory if available
            if (gameState.inventory?.items) {
              dispatch({
                type: 'UPDATE_INVENTORY',
                payload: gameState.inventory.items
              });
            }

            // Update user progress if available
            if (gameState.statistics) {
              dispatch({
                type: 'UPDATE_USER_PROGRESS',
                payload: {
                  xp: gameState.user?.xp || 0,
                  coins: gameState.user?.coins || 0,
                  level: gameState.user?.level || 1,
                  streak: gameState.user?.streak || 0
                }
              });
            }
          }
        } else {
          // User logged out or no user, reset to initial state
          console.debug('[GameContext] No user, resetting to initial state');
          dispatch({ type: 'RESET_GAME_STATE' });
          localStorage.removeItem('gameState');
        }
      } catch (error) {
        console.error('[GameContext] Error initializing game state:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize game state' });
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    window.addEventListener(AUTH_STATE_CHANGE, handleAuthStateChange);
    return () => window.removeEventListener(AUTH_STATE_CHANGE, handleAuthStateChange);
  }, []);

  const getCurrentQuestion = (): BattleQuestion | null => {
    return state.battle?.current_question || null;
  };

  const getBattleStatus = (): BattleStatus => {
    return state.battle?.status || 'idle';
  };

  const getBattleProgress = () => {
    return {
      currentQuestion: (state.battle?.current_question_index || 0) + 1,
      totalQuestions: state.battle?.questions?.length || 0,
      timeLeft: state.battle?.time_remaining || 0,
      score: {
        player: state.battle?.score?.player || 0,
        opponent: state.battle?.score?.opponent || 0
      }
    };
  };

  const getRewards = (): BattleRewards => {
    return state.battle?.rewards || { xp: 0, coins: 0, items: [] };
  };

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