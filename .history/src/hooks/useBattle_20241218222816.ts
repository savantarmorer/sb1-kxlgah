import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { BattleService } from '../services/battleService';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { 
  BattleQuestion, 
  BattleResults, 
  BattleStatus,
  battle_statsDB,
  BattleState,
  BattleRewards
} from '../types/battle';
import { NotificationType } from '../types/notifications';
import { RewardService } from '../services/rewardService';
import { useAchievements } from './useAchievements';
import { useBattleSound } from './useBattleSound';
import { useNotification } from '../contexts/NotificationContext';
import { useTranslation } from '../contexts/LanguageContext';
import { calculateBattleRewards, calculateBattleResults } from '../utils/battleUtils';
import { calculate_level_xp } from '../utils/gameUtils';
import type { Reward } from '../types/rewards';
import { LevelSystem } from '../lib/levelSystem';

interface BattleOptions {
  opponent_id?: string;
  is_bot?: boolean;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export function useBattle() {
  const { state, dispatch } = useGame();
  const { user: authUser, isLoading: isAuthLoading, initialized: authInitialized } = useAuth();
  const { check_achievements } = useAchievements();
  const { play_sound } = useBattleSound();
  const { showSuccess, showError, showInfo } = useNotification();
  const { t } = useTranslation();
  const user = state.user;

  // Track if battle system is ready
  const [isReady, setIsReady] = useState(false);

  // Ensure we have an authenticated user and game state is synced
  useEffect(() => {
    // Don't check until auth is initialized and not loading
    if (!authInitialized || isAuthLoading) {
      return;
    }

    const checkReady = () => {
      const ready = !!authUser?.id && !!user?.id && user.id === authUser.id;

      console.debug('[useBattle] Checking ready state:', {
        isAuthLoading,
        authInitialized,
        authUserId: authUser?.id,
        gameUserId: user?.id,
        ready
      });

      setIsReady(ready);

      if (!ready) {
        if (!authUser?.id) {
          console.error('[useBattle] No authenticated user found');
          showError(t('auth.error.not_authenticated'));
        } else if (!user?.id || user.id !== authUser.id) {
          console.error('[useBattle] Game state not synced with auth state', {
            authUser: authUser?.id,
            gameUser: user?.id
          });
          showError(t('game.error.state_sync'));
        }
      }
    };

    // Add a small delay to allow game state to sync
    const timer = setTimeout(checkReady, 100);
    return () => clearTimeout(timer);
  }, [authUser, user, isAuthLoading, authInitialized, showError, t]);

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

  const initialize_battle = useCallback(async (options?: BattleOptions) => {
    if (!authInitialized || isAuthLoading) {
      throw new Error('Auth state not ready');
    }

    if (!isReady) {
      throw new Error('Battle system not ready');
    }

    try {
      console.debug('[useBattle] Starting battle initialization', {
        options,
        current_state: state.battle?.status,
        user_id: user?.id,
        auth_state: {
          initialized: authInitialized,
          loading: isAuthLoading,
          user_id: authUser?.id
        }
      });

      // Reset any existing battle first
      dispatch({ type: 'RESET_BATTLE' });
      
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'preparing' as BattleStatus });
      play_sound('battle_start');

      console.debug('[useBattle] Fetching battle questions...');
      const questions = await BattleService.fetch_battle_questions(options?.difficulty);
      
      console.debug('[useBattle] Questions fetched successfully', {
        count: questions.length,
        difficulty: options?.difficulty
      });

      // Initialize opponent
      const opponent = options?.is_bot
        ? {
            id: 'bot',
            name: 'Bot Opponent',
            avatar: '/bot-avatar.png',
            is_bot: true as const,
            rating: 1000,
            level: 1
          }
        : await BattleService.get_opponent(options?.opponent_id);

      console.debug('[useBattle] Opponent retrieved', {
        is_bot: options?.is_bot,
        opponent
      });

      // Initialize battle with questions and opponent
      dispatch({
        type: 'INITIALIZE_BATTLE',
        payload: {
          questions,
          time_per_question: BATTLE_CONFIG.time_per_question,
          opponent
        }
      });

      // Set battle to active state after initialization
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'active' as BattleStatus });

      console.debug('[useBattle] Battle activated successfully');

    } catch (error) {
      console.error('[useBattle] Battle initialization failed:', error);
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'error' as BattleStatus });
      showBattleNotification(
        error instanceof Error ? error.message : t('battle.error.initialization')
      );
      throw error;
    }
  }, [dispatch, play_sound, showBattleNotification, state.battle?.status, t, user, authUser, isReady, authInitialized, isAuthLoading]);

  const handle_battle_completion = useCallback(async (results: BattleResults) => {
    if (!user?.id) {
      throw new Error('No authenticated user found');
    }

    try {
      // Calculate complete battle rewards using LevelSystem
      const battle_rewards = LevelSystem.calculate_complete_battle_rewards(
        results.score.player,
        results.stats.total_questions,
        state.battle_stats?.difficulty || 1,
        state.user?.streak || 0,
        state.battle?.time_left || 0
      );

      // Update battle state with final results
      dispatch({ 
        type: 'END_BATTLE',
        payload: {
          status: 'completed' as BattleStatus,
          score: {
            player: results.score.player,
            opponent: results.score.opponent
          },
          rewards: battle_rewards
        }
      });

      // First update battle stats
      await BattleService.update_battle_stats(user.id, results);
      
      // Then check achievements with a try-catch block
      try {
        await check_achievements(
          'battle_complete',
          state.battle?.score?.player || 0
        );
      } catch (achievementError) {
        console.warn('Achievement check failed:', achievementError);
        // Don't throw here - we want to continue with battle completion
      }

      // Show battle completion notification
      const message = `${results.victory ? t('battle.victory') : t('battle.defeat')} - ${t('battle.completed')}`;
      showBattleNotification(message, results.victory);

      // Play appropriate sound
      play_sound(results.victory ? 'victory' : 'defeat');

    } catch (error) {
      console.error('Failed to handle battle completion:', error);
      showBattleNotification(t('battle.error.completion'));
      throw error;
    }
  }, [user, state.battle, state.battle_stats, state.user?.streak, check_achievements, showBattleNotification, t, play_sound, dispatch]);

  const answer_question = useCallback(async (selected_answer: string) => {
    if (!state.user?.id) {
      throw new Error('No authenticated user found');
    }

    try {
      // Initialize battle stats if they don't exist
      const current_battle_stats: battle_statsDB = {
        user_id: state.user.id,
        total_battles: state.battle_stats?.total_battles || 0,
        wins: state.battle_stats?.wins || 0,
        losses: state.battle_stats?.losses || 0,
        win_streak: state.battle_stats?.win_streak || 0,
        highest_streak: state.battle_stats?.highest_streak || 0,
        total_xp_earned: state.battle_stats?.total_xp_earned || 0,
        total_coins_earned: state.battle_stats?.total_coins_earned || 0,
        tournaments_played: state.battle_stats?.tournaments_played || 0,
        tournaments_won: state.battle_stats?.tournaments_won || 0,
        tournament_matches_played: state.battle_stats?.tournament_matches_played || 0,
        tournament_matches_won: state.battle_stats?.tournament_matches_won || 0,
        tournament_rating: state.battle_stats?.tournament_rating || 0,
        difficulty: state.battle_stats?.difficulty || 1,
        updated_at: new Date().toISOString()
      };

      const current_question = state.battle?.questions[state.battle.current_question];
      if (!current_question) {
        throw new Error('No current question found');
      }

      // Check if the selected answer letter matches the correct answer letter
      const is_correct = selected_answer.toUpperCase() === current_question.correct_answer;
      console.debug('[useBattle] Answer result:', { is_correct });

      dispatch({
        type: 'ANSWER_QUESTION',
        payload: {
          answer: selected_answer,
          is_correct
        }
      });

      const battle_state = {
        ...state,
        battle: state.battle,
        battle_stats: current_battle_stats
      };

      const results = await calculateBattleResults(battle_state, selected_answer);
      if (!results) {
        throw new Error('Failed to calculate battle results');
      }

      // Check if this was the last question
      const isLastQuestion = state.battle?.current_question === (state.battle?.questions?.length || 0) - 1;
      if (isLastQuestion) {
        await handle_battle_completion(results);
      }

      return results;
    } catch (error) {
      console.error('Error answering question:', error);
      showError(t('battle.error.answer_failed'));
      throw error;
    }
  }, [state, dispatch, handle_battle_completion, showError, t]);

  const reset_battle = useCallback(() => {
    dispatch({ type: 'RESET_BATTLE' });
  }, [dispatch]);

  const get_current_question = useCallback((): BattleQuestion | null => {
    if (!state.battle?.questions || typeof state.battle.current_question !== 'number') {
      return null;
    }
    return state.battle.questions[state.battle.current_question];
  }, [state.battle]);

  const get_battle_progress = useCallback(() => {
    if (!state.battle) {
      return {
        current_question: 0,
        total_questions: 0,
        score: { player: 0, opponent: 0 },
        time_left: 0
      };
    }

    return {
      current_question: state.battle.current_question,
      total_questions: state.battle.questions.length,
      score: state.battle.score,
      time_left: state.battle.time_left
    };
  }, [state.battle]);

  return {
    initialize_battle,
    answer_question,
    reset_battle,
    get_current_question,
    get_battle_progress,
    get_battle_rewards,
    battle: state.battle,
    loading: isAuthLoading || !authInitialized,
    error: state.battle?.error,
    isReady
  };
}