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
          console.debug('[GameContext] Auth state changed, initializing game state for user:', customEvent.detail.id);
          
          // First initialize the user in game state
          dispatch({ type: 'INITIALIZE_USER', payload: customEvent.detail });

          // Then fetch and initialize the complete game state
          const gameState = await BattleService.getCurrentGameState(customEvent.detail.id);
          
          if (!gameState) {
            throw new Error('Failed to fetch game state');
          }

          console.debug('[GameContext] Game state fetched:', {
            user: gameState.user,
            battle_stats: gameState.battle_stats,
            inventory: gameState.inventory,
            statistics: gameState.statistics
          });

          // Update user state with complete profile data
          if (gameState.user) {
            dispatch({ 
              type: 'UPDATE_USER_PROFILE', 
              payload: {
                ...gameState.user,
                battle_stats: gameState.battle_stats
              }
            });
          } else {
            console.error('[GameContext] No user data in game state');
          }

          // Update battle stats
          if (gameState.battle_stats) {
            dispatch({ 
              type: 'UPDATE_BATTLE_STATS', 
              payload: gameState.battle_stats 
            });
          } else {
            console.debug('[GameContext] No battle stats in game state, initializing defaults');
            dispatch({
              type: 'UPDATE_BATTLE_STATS',
              payload: {
                total_battles: 0,
                wins: 0,
                losses: 0,
                win_streak: 0,
                highest_streak: 0,
                total_xp_earned: 0,
                total_coins_earned: 0,
                difficulty: 1
              }
            });
          }

          // Update inventory if available
          if (gameState.inventory?.items) {
            dispatch({
              type: 'UPDATE_INVENTORY',
              payload: { items: gameState.inventory.items }
            });
          }

          // Update statistics if available
          if (gameState.statistics) {
            dispatch({
              type: 'UPDATE_USER_STATS',
              payload: { quest_progress: gameState.statistics }
            });
          }

          // Update quests if available
          if (gameState.quests) {
            dispatch({
              type: 'UPDATE_USER_STATS',
              payload: { quest_progress: gameState.quests }
            });
          }

          // Update achievements if available
          if (gameState.achievements) {
            dispatch({
              type: 'UPDATE_USER_STATS',
              payload: { quest_progress: { achievements: gameState.achievements } }
            });
          }

          console.debug('[GameContext] Game state initialization complete');
        } else {
          console.debug('[GameContext] No user, resetting game state');
          dispatch({ type: 'RESET_BATTLE' });
        }
      } catch (error) {
        console.error('[GameContext] Error initializing game state:', error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'Failed to initialize game state' 
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

  const getRewards = (): BattleRewards => {
    return state.battle?.rewards || {
      xp_earned: 0,
      coins_earned: 0,
      streak_bonus: 0,
      time_bonus: 0
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