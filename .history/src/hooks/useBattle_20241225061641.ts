import { useState, useCallback, useEffect } from 'react';
import { BattleQuestion, PlayerState, BattlePhase, calculateBattleRewards, BattleRewards } from '../types/battle';
import { supabase } from '../lib/supabase';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { useNotification } from '../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { BattleService } from '../services/BattleService';
import { Card } from '../utils/cardUtils';

export function useBattle() {
  const { t } = useTranslation();
  const { showError, showInfo, showSuccess } = useNotification();
  const { authUser, isAuthLoading, authInitialized } = useAuth();
  const { state, dispatch, user } = useGame();

  // Battle state
  const [phase, setPhase] = useState<BattlePhase>(BattlePhase.PREPARING);
  const [currentQuestion, setCurrentQuestion] = useState<BattleQuestion | null>(null);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(BATTLE_CONFIG.time_per_question);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [currentDamage, setCurrentDamage] = useState(0);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [streak, setStreak] = useState(0);

  // Player states
  const [playerState, setPlayerState] = useState<PlayerState>({ health: 50, shield: 0, isReady: false });
  const [opponentState, setOpponentState] = useState<PlayerState>({ health: 50, shield: 0, isReady: false });

  // Check if state is properly synced
  useEffect(() => {
    const checkReady = () => {
      const hasAuthUser = !!authUser && !isAuthLoading && authInitialized;
      const hasGameUser = !!user;
      const isStateSynced = hasAuthUser && hasGameUser && user.id === authUser.id;

      if (!isStateSynced) {
        if (!hasAuthUser) {
          console.error('[useBattle] No authenticated user found');
          showError(t('auth.error.not_authenticated'));
        } else if (!hasGameUser) {
          console.error('[useBattle] No game user state found. Waiting for game state initialization...');
          showError(t('game.error.no_user_state'));
          // Trigger a game state refresh
          dispatch({ type: 'SET_LOADING', payload: true });
          BattleService.getCurrentGameState(authUser.id)
            .then(gameState => {
              if (gameState?.user) {
                dispatch({ type: 'UPDATE_USER_PROFILE', payload: gameState.user });
                if (gameState.battle_stats) {
                  dispatch({ 
                    type: 'UPDATE_BATTLE_STATUS', 
                    payload: { 
                      status: 'idle',
                      ...gameState.battle_stats 
                    }
                  });
                }
              }
            })
            .catch(error => {
              console.error('[useBattle] Failed to refresh game state:', error);
              showError(t('game.error.refresh_failed'));
            })
            .finally(() => {
              dispatch({ type: 'SET_LOADING', payload: false });
            });
        } else if (user.id !== authUser.id) {
          console.error('[useBattle] Game state not synced with auth state', {
            authUser: authUser?.id,
            gameUser: user?.id
          });
          showError(t('game.error.state_sync'));
        }
      }
    };
    // Initial check
    checkReady();

    // Set up periodic checks
    const checkInterval = setInterval(checkReady, 1000);

    return () => {
      clearInterval(checkInterval);
    };
  }, [authUser, user, isAuthLoading, authInitialized, showError, t, state.battle_stats, dispatch]);

  const get_battle_rewards = useCallback((): BattleRewards => {
    if (!state.battle?.rewards) {
      return {
        xp_earned: 0,
        coins_earned: 0,
        streak_bonus: 0,
        time_bonus: 0
      };
    }
    return state.battle.rewards;
  }, [state.battle?.rewards]);

  const calculate_xp_gained = useCallback((score: number, total_questions: number): number => {
    const difficulty_multiplier = state.battle_stats?.difficulty || 1;
    const streak_multiplier = state.user?.streak || 0;
    
    const rewards = calculateBattleRewards(
      score,
      total_questions,
      difficulty_multiplier,
      streak_multiplier
    );
    
    return rewards.xp_earned;
  }, [state.battle_stats?.difficulty, state.user?.streak]);

  const calculate_coins_earned = useCallback((score: number, total_questions: number): number => {
    const difficulty_multiplier = state.battle_stats?.difficulty || 1;
    const streak_multiplier = state.user?.streak || 0;
    
    const rewards = calculateBattleRewards(
      score,
      total_questions,
      difficulty_multiplier,
      streak_multiplier
    );
    
    return rewards.coins_earned;
  }, [state.battle_stats?.difficulty, state.user?.streak]);

  const showBattleNotification = useCallback((message: string, isVictory?: boolean) => {
    if (isVictory === undefined) {
      showInfo(message);
    } else {
      isVictory ? showSuccess(message) : showError(message);
    }
  }, [showInfo, showSuccess, showError]);

  // ... rest of the code (handleAnswer, handleResolutionComplete, initializeBattle) ...

  return {
    phase,
    currentQuestion,
    questions,
    currentQuestionIndex,
    timeLeft,
    selectedAnswer,
    isAnswerCorrect,
    currentDamage,
    score,
    streak,
    playerState,
    opponentState,
    handleAnswer,
    handleResolutionComplete,
    initializeBattle,
    setTimeLeft,
    setPhase,
    get_battle_rewards,
    calculate_xp_gained,
    calculate_coins_earned,
    showBattleNotification
  };
}