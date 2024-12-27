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
  error: {
    message: string;
    code: string;
  };
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
  getRewards: () => BattleRewards,
  error: {
    message: string;
    code: string;
  }
): GameContextType => {
  return {
    state,
    dispatch,
    loading,
    initialized,
    getCurrentQuestion,
    getBattleStatus,
    getBattleProgress,
    getRewards,
    error
  };
};

interface GameProviderProps {
  children: React.ReactNode;
  initialState?: GameState;
  skipInitialLoad?: boolean;
}

export const GameProvider: React.FC<GameProviderProps> = ({ 
  children, 
  initialState = initialGameState,
  skipInitialLoad = false 
}) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [loading, setLoading] = useState(!skipInitialLoad);
  const [initialized, setInitialized] = useState(skipInitialLoad);

  const retryOperation = async (
    operation: () => Promise<any>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<any> => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`[GameContext] Retry ${i + 1}/${maxRetries} failed:`, error);
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }
    throw lastError;
  };

  // Initialize game state from local storage if available
  useEffect(() => {
    if (skipInitialLoad) return;

    const initializeFromStorage = async () => {
      try {
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          if (parsedState.user && parsedState.user.id) {
            // First verify if the user is still valid by fetching current game state
            const gameState = await BattleService.getCurrentGameState(parsedState.user.id);
            
            if (gameState && gameState.user) {
              dispatch({ type: 'INITIALIZE_USER', payload: gameState.user });
              
              if (gameState.battle) {
                dispatch({ type: 'UPDATE_BATTLE_PROGRESS', payload: gameState.battle });
              }
              
              if (gameState.statistics) {
                dispatch({ 
                  type: 'UPDATE_USER_PROFILE',
                  payload: {
                    ...gameState.user,
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
            } else {
              // If no valid game state, clear local storage
              localStorage.removeItem('gameState');
            }
          }
        }
      } catch (error) {
        console.error('[GameContext] Failed to restore game state:', error);
        localStorage.removeItem('gameState');
      } finally {
        setLoading(false);
      }
    };

    initializeFromStorage();
  }, [skipInitialLoad]);

  // Save state to local storage when it changes
  useEffect(() => {
    if (skipInitialLoad) return;
    if (!loading && state.user) {
      localStorage.setItem('gameState', JSON.stringify({
        user: state.user,
        battle: state.battle,
        statistics: state.statistics,
        inventory: state.inventory
      }));
    }
  }, [state, loading, skipInitialLoad]);

  // Listen for auth state changes and initialize game state
  useEffect(() => {
    if (skipInitialLoad) return;

    const handleAuthStateChange = async (event: Event) => {
      const customEvent = event as CustomEvent<User | null>;
      setLoading(true);

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
              dispatch({ 
                type: 'UPDATE_USER_PROFILE', 
                payload: { 
                  ...gameState.user,
                  battle_stats: gameState.battle_stats 
                } 
              });
            }

            if (gameState.battle) {
              dispatch({ 
                type: 'UPDATE_BATTLE_PROGRESS', 
                payload: gameState.battle 
              });
            }

            if (gameState.inventory) {
              dispatch({
                type: 'UPDATE_INVENTORY',
                payload: { items: gameState.inventory.items || [] }
              });
            }

            if (gameState.statistics) {
              dispatch({
                type: 'UPDATE_USER_PROFILE',
                payload: {
                  ...gameState.user,
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
        setLoading(false);
      }
    };

    window.addEventListener(AUTH_STATE_CHANGE, handleAuthStateChange);
    return () => window.removeEventListener(AUTH_STATE_CHANGE, handleAuthStateChange);
  }, [skipInitialLoad]);

  // Listen for visibility changes and handle state restoration
  useEffect(() => {
    if (skipInitialLoad) return;

    let isRefreshing = false;
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && state.user?.id && !isRefreshing) {
        console.debug('[GameContext] App became visible, refreshing game state');
        isRefreshing = true;
        
        try {
          // Don't set loading true immediately to avoid flickering
          console.debug('[GameContext] Fetching current game state for user:', state.user.id);
          const gameState = await retryOperation(async () => {
            const gameState = await BattleService.getCurrentGameState(state.user!.id);
            if (!gameState || !gameState.user || !gameState.battle_stats || !gameState.statistics) {
              throw new Error('Invalid or incomplete game state received');
            }
            return gameState;
          });
          
          if (gameState && gameState.user) {
            // Only set loading true if we need to update the state
            setLoading(true);
            
            console.debug('[GameContext] Received game state:', {
              user: !!gameState.user,
              battle_stats: !!gameState.battle_stats,
              statistics: !!gameState.statistics,
              battle: !!gameState.battle,
              inventory: !!gameState.inventory
            });
            
            // First reset the state to ensure clean update
            dispatch({ type: 'RESET_BATTLE' });
            
            // Update user first
            dispatch({ type: 'INITIALIZE_USER', payload: gameState.user });

            // Then update battle stats and statistics together
            if (gameState.battle_stats && gameState.statistics) {
              dispatch({
                type: 'UPDATE_USER_PROFILE',
                payload: {
                  ...gameState.user,
                  battle_stats: gameState.battle_stats,
                  xp: gameState.statistics.total_xp,
                  coins: gameState.statistics.total_coins,
                  level: gameState.user.level,
                  streak: gameState.statistics.current_streak
                }
              });
            }

            // Then update battle state if active
            if (gameState.battle && gameState.battle.status !== 'idle') {
              dispatch({
                type: 'UPDATE_BATTLE_PROGRESS',
                payload: {
                  ...gameState.battle,
                  questions: gameState.battle.questions || [],
                  opponent: gameState.battle.opponent,
                  time_per_question: gameState.battle.time_per_question,
                  in_progress: gameState.battle.status !== 'completed' && 
                             gameState.battle.status !== 'victory' && 
                             gameState.battle.status !== 'defeat' && 
                             gameState.battle.status !== 'error'
                }
              });
            }
            
            // Finally update inventory
            if (gameState.inventory) {
              dispatch({
                type: 'UPDATE_INVENTORY',
                payload: { 
                  items: gameState.inventory.items || [],
                  equipped: gameState.inventory.equipped || []
                }
              });
            }

            // Save restored state to localStorage
            const stateToSave = {
              user: gameState.user,
              battle: gameState.battle,
              battle_stats: gameState.battle_stats,
              statistics: gameState.statistics,
              inventory: gameState.inventory
            };
            localStorage.setItem('gameState', JSON.stringify(stateToSave));
            sessionStorage.setItem(`gameState_${state.user.id}`, JSON.stringify(stateToSave));
            sessionStorage.setItem(`gameState_${state.user.id}_time`, Date.now().toString());

            console.debug('[GameContext] State refresh completed successfully');
            setInitialized(true);
          } else {
            console.error('[GameContext] Received invalid game state:', {
              hasUser: !!gameState?.user,
              hasBattleStats: !!gameState?.battle_stats,
              hasStatistics: !!gameState?.statistics
            });
            // Try to recover using cached state
            const cachedState = sessionStorage.getItem(`gameState_${state.user.id}`);
            if (cachedState) {
              const parsedState = JSON.parse(cachedState);
              if (parsedState && parsedState.user && parsedState.user.id === state.user.id) {
                console.debug('[GameContext] Using cached state as fallback');
                return parsedState;
              }
            }
            dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh game state: Invalid state received' });
          }
        } catch (error) {
          console.error('[GameContext] Failed to refresh game state after retries:', error);
          
          // Try to recover using cached state first
          const cachedState = sessionStorage.getItem(`gameState_${state.user.id}`);
          if (cachedState) {
            try {
              const parsedState = JSON.parse(cachedState);
              if (parsedState && parsedState.user && parsedState.user.id === state.user.id) {
                console.debug('[GameContext] Recovering from sessionStorage');
                return parsedState;
              }
            } catch (cacheError) {
              console.warn('[GameContext] Failed to parse cached state:', cacheError);
            }
          }
          
          // If no cached state, try localStorage
          try {
            const savedState = localStorage.getItem('gameState');
            if (savedState) {
              const parsedState = JSON.parse(savedState);
              if (parsedState.user && parsedState.user.id === state.user?.id) {
                console.debug('[GameContext] Recovering from localStorage');
                dispatch({ type: 'INITIALIZE_USER', payload: parsedState.user });
                if (parsedState.battle) {
                  dispatch({ type: 'UPDATE_BATTLE_PROGRESS', payload: parsedState.battle });
                }
              }
            }
          } catch (recoveryError) {
            console.error('[GameContext] Recovery from localStorage failed:', recoveryError);
          }
          
          dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh game state: ' + (error as Error).message });
        } finally {
          setLoading(false);
          isRefreshing = false;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [skipInitialLoad, state.user?.id, dispatch]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && state.user?.id) {
        sessionStorage.setItem(`lastActiveTime_${state.user.id}`, Date.now().toString());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.user?.id]);

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
      time_bonus: 0,
      total_xp: 0,
      total_coins: 0
    };
  };

  // Don't render children until initial state is loaded
  if (loading && !skipInitialLoad) {
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
    getRewards,
    {
      message: state.error || '',
      code: ''
    }
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