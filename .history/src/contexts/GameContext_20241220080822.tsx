import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { gameReducer } from './game/reducer';
import type { GameState } from '../types/game';
import type { GameAction } from './game/types';
import type { BattleQuestion, BattleStatus, BattleRewards } from '../types/battle';
import { initialGameState } from './game/initialState';
import { AUTH_STATE_CHANGE } from './AuthContext';
import type { User } from '../types/user';
import { BattleService } from '../services/battleService';
import { debounce } from 'lodash';

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
  const [loadingStates, setLoadingStates] = useState({
    initial: true,
    sync: false,
    battle: false
  });
  const [initialized, setInitialized] = useState(false);

  // Initialize game state from local storage if available
  useEffect(() => {
    if (initialized) return;
    
    const initializeFromStorage = async () => {
      try {
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          if (parsedState.user && parsedState.user.id) {
            const gameState = await BattleService.getCurrentGameState(parsedState.user.id);
            
            if (gameState && gameState.user) {
              dispatch({ type: 'INITIALIZE_USER', payload: gameState.user });
              
              if (gameState.battle) {
                dispatch({ type: 'UPDATE_BATTLE_STATE', payload: { state: gameState.battle } });
              }
              
              if (gameState.statistics) {
                dispatch({ 
                  type: 'UPDATE_USER_PROGRESS',
                  payload: {
                    xp: gameState.statistics.total_xp,
                    coins: gameState.statistics.total_coins,
                    level: gameState.user.level || 1,
                    streak: gameState.statistics.current_streak
                  }
                });
              }
              
              if (gameState.inventory) {
                dispatch({ type: 'UPDATE_INVENTORY', payload: { items: gameState.inventory.items || [] } });
              }
              setInitialized(true);
            }
          }
        }
      } catch (error) {
        console.error('[GameContext] Failed to restore game state:', error);
      } finally {
        setLoadingStates(prev => ({ ...prev, initial: false }));
      }
    };

    initializeFromStorage();
  }, [initialized]);

  // Save state to local storage when it changes
  useEffect(() => {
    if (!loadingStates.battle && state.user) {
      localStorage.setItem('gameState', JSON.stringify({
        user: state.user,
        battle: state.battle,
        statistics: state.statistics,
        inventory: state.inventory
      }));
    }
  }, [state, loadingStates.battle]);

  // Listen for auth state changes and initialize game state
  useEffect(() => {
    const handleAuthStateChange = async (event: Event) => {
      const customEvent = event as CustomEvent<User | null>;
      setLoadingStates(prev => ({ ...prev, battle: true }));

      try {
        if (customEvent.detail) {
          console.debug('[GameContext] Auth state changed, initializing game state for user:', customEvent.detail.id);
          
          // Fetch complete game state first
          const gameState = await BattleService.getCurrentGameState(customEvent.detail.id);
          
          if (gameState && gameState.user) {
            // Initialize with complete user data from game state
            dispatch({ type: 'INITIALIZE_USER', payload: gameState.user });
            console.debug('[GameContext] Initialized user with complete data:', gameState.user);

            // Update all state in correct order
            if (gameState.battle_stats) {
              dispatch({ type: 'UPDATE_USER_STATS', payload: { quest_progress: gameState.battle_stats } });
            }

            if (gameState.battle) {
              dispatch({ type: 'UPDATE_BATTLE_STATE', payload: { state: gameState.battle } });
            }

            if (gameState.inventory) {
              dispatch({
                type: 'UPDATE_INVENTORY',
                payload: { items: gameState.inventory.items || [] }
              });
            }

            if (gameState.statistics) {
              dispatch({
                type: 'UPDATE_USER_PROGRESS',
                payload: {
                  xp: gameState.statistics.total_xp,
                  coins: gameState.statistics.total_coins,
                  level: gameState.user.level,
                  streak: gameState.statistics.current_streak
                }
              });
            }

            setInitialized(true);
          } else {
            console.error('[GameContext] Failed to fetch complete game state');
            // Initialize with basic user data if game state fetch fails
            dispatch({ type: 'INITIALIZE_USER', payload: customEvent.detail });
          }
        } else {
          // Clear state on logout
          dispatch({ type: 'RESET_BATTLE' });
          localStorage.removeItem('gameState');
          setInitialized(false);
        }
      } catch (error) {
        console.error('[GameContext] Error initializing game state:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize game state' });
        // Initialize with basic user data if there's an error
        if (customEvent.detail) {
          dispatch({ type: 'INITIALIZE_USER', payload: customEvent.detail });
        }
      } finally {
        setLoadingStates(prev => ({ ...prev, battle: false }));
      }
    };

    window.addEventListener(AUTH_STATE_CHANGE, handleAuthStateChange);
    return () => window.removeEventListener(AUTH_STATE_CHANGE, handleAuthStateChange);
  }, []);

  const debouncedSync = useCallback(
    debounce((userId: string) => {
      return BattleService.getCurrentGameState(userId).then(gameState => {
        if (gameState?.battle?.status === 'active') {
          dispatch({ type: 'UPDATE_BATTLE_STATE', payload: { state: gameState.battle } });
        }
      });
    }, 1000),
    [dispatch]
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' && 
        state.user?.id &&
        state.battle?.status === 'active'
      ) {
        setLoadingStates(prev => ({ ...prev, sync: true }));
        Promise.resolve(debouncedSync(state.user.id))
          .catch(error => {
            console.error('[GameContext] Sync error:', error);
          })
          .finally(() => {
            setLoadingStates(prev => ({ ...prev, sync: false }));
          });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      debouncedSync.cancel();
    };
  }, [state.user?.id, state.battle?.status, debouncedSync]);

  // Modify the initial loading state
  useEffect(() => {
    if (initialized) {
      setLoadingStates(prev => ({ ...prev, initial: false }));
    }
  }, [initialized]);

  const getCurrentQuestion = (): BattleQuestion | null => {
    if (!state.battle?.questions?.length) return null;
    const currentIndex = state.battle.current_question;
    return currentIndex < state.battle.questions.length ? state.battle.questions[currentIndex] : null;
  };

  const getBattleStatus = (): BattleStatus => {
    return state.battle?.status || 'idle';
  };

  const getBattleProgress = () => {
    return {
      currentQuestion: state.battle?.current_question || 0,
      totalQuestions: state.battle?.questions?.length || 0,
      timeLeft: state.battle?.time_left || 0,
      score: {
        player: state.battle?.score?.player || 0,
        opponent: state.battle?.score?.opponent || 0
      }
    };
  };

  const getRewards = (): BattleRewards => {
    return state.battle?.rewards || {
      xp_earned: 0,
      coins_earned: 0,
      streak_bonus: 0,
      time_bonus: 0
    };
  };

  // Don't render children until initial state is loaded
  if (loadingStates.initial) {
    return null;
  }

  const value = createGameValue(
    state,
    dispatch,
    Object.values(loadingStates).some(Boolean),
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