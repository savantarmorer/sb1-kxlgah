import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { gameReducer } from './game/reducer';
import type { GameState } from '../types/game';
import type { GameAction } from './game/types';
import type { BattleQuestion, BattleStatus } from '../types/battle';
import { initialGameState } from './game/initialState';
import LoadingScreen from '../components/LoadingScreen';
import { supabase } from '../lib/supabase';

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
  const { user: authUser, isLoading: authLoading, initialized: authInitialized } = useAuth();

  useEffect(() => {
    let mounted = true;

    const initializeGameState = async () => {
      if (!mounted) return;

      if (authInitialized) {
        if (authUser) {
          try {
            const { data: userProfile, error } = await supabase
              .from('profiles')
              .select(`
                *,
                battle_stats!user_id(*),
                user_inventory!user_id(*),
                user_achievements!user_id(*)
              `)
              .eq('id', authUser.id)
              .single();

            if (error) {
              dispatch({ 
                type: 'SET_ERROR', 
                payload: 'Failed to load user profile. Please try again.' 
              });
              console.error('Failed to initialize game state:', error);
              return;
            }

            dispatch({ 
              type: 'INITIALIZE_USER', 
              payload: userProfile 
            });

            setInitialized(true);
          } catch (error) {
            dispatch({ 
              type: 'SET_ERROR', 
              payload: 'An unexpected error occurred. Please refresh the page.' 
            });
            console.error('Failed to initialize game state:', error);
          }
        } else {
          dispatch({ type: 'RESET_STATE' });
          setInitialized(false);
        }
        setLoading(false);
      }
    };

    initializeGameState();

    return () => {
      mounted = false;
    };
  }, [authUser?.id, authInitialized, dispatch]);

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!authInitialized) {
    return <LoadingScreen message="Initializing..." />;
  }

  if (!authUser && !state.error) {
    return <Navigate to="/login" replace />;
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Failed to load game data</h2>
          <p className="text-gray-600">{state.error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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