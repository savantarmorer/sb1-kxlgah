import { useState, useEffect, useCallback } from 'react';
import { use_game } from '../contexts/GameContext';
import { BattleService } from '../services/battleService';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { 
  BattleQuestion, 
  BattleResults, 
  BattleStatus,
  DBbattle_stats as BattleDBStats
} from '../types/battle';
import { NotificationType } from '../types/notifications';
import { RewardService } from '../services/rewardService';
import { useAchievements } from './useAchievements';
import { useBattleSound } from './useBattleSound';
import { useNotification } from '../contexts/NotificationContext';
import { useTranslation } from '../contexts/LanguageContext';
import { calculate_battle_results } from '../utils/battleUtils';
import { calculate_xp_reward, calculate_coin_reward } from '../utils/gameUtils';
import type { Reward } from '../types/rewards';

export function useBattle() {
  const { state, dispatch } = use_game();
  const { check_achievements } = useAchievements();
  const { play_sound } = useBattleSound();
  const { showSuccess, showError, showInfo } = useNotification();
  const { t } = useTranslation();
  const user = state.user;

  // Ensure we have an authenticated user
  useEffect(() => {
    if (!user?.id) {
      console.error('[useBattle] No authenticated user found');
      showError(t('auth.error.not_authenticated'));
    }
  }, [user, showError, t]);

  const calculate_xp_gained = (score: number, total_questions: number): number => {
    if (!state.battle_stats) {
      return BATTLE_CONFIG.progress.base_xp * (score / total_questions);
    }
    const base_xp = BATTLE_CONFIG.progress.base_xp * (score / total_questions);
    return calculate_xp_reward(base_xp, state.battle_stats.difficulty || 1, state.user.streak);
  };

  const calculate_coins_earned = (score: number, total_questions: number): number => {
    if (!state.battle_stats) {
      return BATTLE_CONFIG.progress.base_coins * (score / total_questions);
    }
    const base_coins = BATTLE_CONFIG.progress.base_coins * (score / total_questions);
    return calculate_coin_reward(base_coins, state.battle_stats.difficulty || 1, state.user.streak);
  };

  const showBattleNotification = (message: string, isVictory?: boolean) => {
    if (isVictory === undefined) {
      showInfo(message);
    } else {
      isVictory ? showSuccess(message) : showError(message);
    }
  };

  const initialize_battle = useCallback(async (options?: {
    opponent_id?: string;
    is_bot?: boolean;
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }) => {
    try {
      console.debug('[useBattle] Starting battle initialization', {
        options,
        current_state: state.battle?.status
      });

      // Reset any existing battle first
      dispatch({ type: 'RESET_BATTLE' });
      
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'waiting' });
      play_sound('battle_start');

      console.debug('[useBattle] Fetching battle questions...');
      // Get questions from the battle service
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
        : (await BattleService.get_opponent(options?.opponent_id));

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
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'active' });

      console.debug('[useBattle] Battle activated successfully');

    } catch (error) {
      console.error('[useBattle] Battle initialization failed:', error);
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'error' });
      showBattleNotification(t('battle.error.initialization'));
    }
  }, [dispatch, play_sound, showBattleNotification, state.user.level, t, user]);

  const handle_battle_completion = useCallback(async (results: BattleResults) => {
    try {
      // Calculate rewards using RewardService
      const reward_results = RewardService.calculate_battle_rewards(results);
      
      // Sum up total XP including all bonuses
      const total_xp_gain = reward_results.rewards.reduce((sum: number, r: Reward) => 
        r.type === 'xp' ? sum + (typeof r.value === 'number' ? r.value : 0) : sum, 0
      );

      // Sum up total coins including all bonuses
      const total_coins_gain = reward_results.rewards.reduce((sum: number, r: Reward) => 
        r.type === 'coins' ? sum + (typeof r.value === 'number' ? r.value : 0) : sum, 0
      );

      if (!user?.id) {
        throw new Error('No authenticated user found');
      }

      // Update battle state with final results
      dispatch({ 
        type: 'END_BATTLE',
        payload: {
          status: 'completed',
          score: {
            player: results.player_score,
            opponent: results.opponent_score
          },
          rewards: {
            xp_earned: total_xp_gain,
            coins_earned: total_coins_gain,
            streak_bonus: results.streak_bonus,
            time_bonus: (state.battle?.time_left ?? 0) * BATTLE_CONFIG.rewards.time_bonus.multiplier
          }
        }
      });

      // First update battle stats
      await BattleService.update_stats(user.id, results, state.battle_stats);
      
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
      const message = `${results.is_victory ? t('battle.victory') : t('battle.defeat')} - ${t('battle.completed')}`;
      showBattleNotification(message, results.is_victory);

      // Play appropriate sound
      play_sound(results.is_victory ? 'victory' : 'defeat');

    } catch (error) {
      console.error('Failed to handle battle completion:', error);
      showBattleNotification(t('battle.error.completion'));
      throw error;
    }
  }, [user, state.battle, state.battle_stats, check_achievements, showBattleNotification, t, play_sound, dispatch]);

  const answer_question = useCallback(async (selected_answer: string) => {
    try {
      // Initialize battle stats if they don't exist
      const current_battle_stats: BattleDBStats = {
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
      if (!current_question) return;

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

      const results = await calculate_battle_results(battle_state, selected_answer);

      // Check if this was the last question
      const isLastQuestion = state.battle?.current_question === (state.battle?.questions?.length || 0) - 1;
      if (isLastQuestion && results) {
        await handle_battle_completion(results);
      }

      return results;
    } catch (error) {
      console.error('Error answering question:', error);
      showError(t('battle.error.answer_failed'));
    }
  }, [state, dispatch, showError, t, handle_battle_completion]);

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
    return {
      current_question: state.battle?.current_question || 0,
      total_questions: state.battle?.questions?.length || 0,
      time_left: state.battle?.time_left || 0,
      score: state.battle?.score || { player: 0, opponent: 0 }
    };
  }, [state.battle]);

  const get_battle_rewards = useCallback(() => {
    return {
      xp_earned: state.battle?.rewards?.xp_earned || 0,
      coins_earned: state.battle?.rewards?.coins_earned || 0,
      streak_bonus: state.battle?.rewards?.streak_bonus || 0,
      time_bonus: state.battle?.rewards?.time_bonus || 0
    };
  }, [state.battle?.rewards]);

  return {
    battle_state: state.battle,
    initialize_battle,
    answer_question,
    reset_battle,
    get_current_question,
    get_battle_progress,
    get_battle_rewards,
    calculate_xp_gained,
    calculate_coins_earned,
    handle_battle_completion
  };
}