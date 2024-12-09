import { useCallback, useEffect } from 'react';
import { use_game } from '../contexts/GameContext';
import { BattleService } from '../services/battleService';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { BattleResults, BattleQuestion, BotOpponent } from '../types/battle';
import { Reward } from '../types/rewards';
import { useAchievements } from '../hooks/useAchievements';
import { useBattleSound } from '../hooks/useBattleSound';
import { RewardService } from '../services/rewardService';
import { useNotification } from '../contexts/NotificationContext';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { calculate_xp_reward, calculate_coin_reward } from '../utils/gameUtils';
import { calculate_battle_results } from '../utils/battleUtils';

export function useBattle() {
  const { state, dispatch } = use_game();
  const { check_achievements } = useAchievements();
  const { play_sound } = useBattleSound();
  const { showNotification } = useNotification();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Ensure we have an authenticated user
  useEffect(() => {
    if (!user?.id) {
      console.error('[useBattle] No authenticated user found');
      showNotification({
        type: 'error',
        message: t('auth.error.not_authenticated'),
        duration: 5000
      });
    }
  }, [user, showNotification, t]);

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
    return calculate_coin_reward(base_coins, state.user.level, state.user.streak);
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
      
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'searching' });
      play_sound('battle_start');

      console.debug('[useBattle] Fetching battle questions...');
      // Get questions from the battle service
      const questions = await BattleService.fetch_battle_questions(options?.difficulty);
      
      console.debug('[useBattle] Questions fetched successfully', {
        count: questions.length,
        difficulties: questions.map(q => q.difficulty)
      });

      // Get opponent data
      if (!user?.id) {
        throw new Error('No authenticated user found');
      }
      console.debug('[useBattle] Getting opponent...');
      const opponent = options?.is_bot 
        ? {
            id: `bot-${Date.now()}`,
            name: 'Bot Opponent',
            rating: BATTLE_CONFIG.matchmaking.default_rating,
            is_bot: true as const
          }
        : (await BattleService.get_opponent(options?.opponent_id)) as BotOpponent;

      console.debug('[useBattle] Opponent retrieved', {
        is_bot: options?.is_bot,
        opponent_id: opponent.id,
        user_id: user.id
      });

      dispatch({
        type: 'INITIALIZE_BATTLE',
        payload: {
          questions,
          opponent,
          time_per_question: BATTLE_CONFIG.time_per_question,
        }
      });

      console.debug('[useBattle] Battle state initialized');

      // Set battle to active state after initialization
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'active' });

      console.debug('[useBattle] Battle activated successfully');

      showNotification({
        type: 'battle',
        message: t('battle.starting'),
        duration: 3000
      });

    } catch (error) {
      console.error('[useBattle] Battle initialization failed:', error);
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'error' });
      showNotification({
        type: 'error',
        message: t('battle.error.initialization'),
        duration: 5000
      });
    }
  }, [dispatch, play_sound, showNotification, state.user.level, t, user]);

  const handle_battle_completion = useCallback(async (results: BattleResults) => {
    // Calculate rewards
    const reward_results = RewardService.calculate_battle_rewards(results);
    
    // Calculate total XP gain including bonuses
    const total_xp_gain = reward_results.rewards.reduce((sum: number, r: Reward) => 
      r.type === 'xp' ? sum + (typeof r.value === 'number' ? r.value : 0) : sum, 0
    );

    // Calculate total coins gain
    const total_coins_gain = reward_results.rewards.reduce((sum: number, r: Reward) => 
      r.type === 'coins' ? sum + (typeof r.value === 'number' ? r.value : 0) : sum, 0
    );

    try {
      // Update battle stats in database
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

      await BattleService.update_stats(user.id, results, state.battle_stats);
      
      // Check for achievements
      await check_achievements();

      // Show battle completion notification
      showNotification({
        type: 'battle',
        message: `${results.is_victory ? t('battle.victory') : t('battle.defeat')} - ${t('battle.completed')}`,
        duration: 5000,
        data: {
          rewards: reward_results.rewards,
          is_victory: results.is_victory
        }
      });

      // Play appropriate sound
      play_sound(results.is_victory ? 'victory' : 'defeat');
    } catch (error) {
      console.error('Failed to handle battle completion:', error);
      showNotification({
        type: 'error',
        message: t('battle.error.completion'),
        duration: 5000
      });
    }
  }, [user, state.battle_stats, check_achievements, showNotification, t, play_sound, dispatch]);

  const answer_question = useCallback(async (selected_answer: string) => {
    try {
      // Initialize default battle stats if they don't exist
      const current_battle_stats = state.battle_stats || {
        user_id: state.user.id,
        total_battles: 0,
        wins: 0,
        losses: 0,
        win_streak: 0,
        highest_streak: 0,
        total_xp_earned: 0,
        total_coins_earned: 0,
        updated_at: new Date().toISOString(),
        difficulty: 1
      };

      // Ensure battle state exists
      if (!state.battle) {
        throw new Error('Cannot answer question: No battle state');
      }

      // Use current_battle_stats instead of state.battle_stats
      const battle_results = await calculate_battle_results({
        ...state,
        battle: state.battle,
        battle_stats: current_battle_stats,
        battleRatings: state.battleRatings || {
          user_id: state.user.id,
          rating: 0,
          wins: 0,
          losses: 0,
          streak: 0,
          highest_streak: 0,
          updated_at: new Date().toISOString()
        },
        login_history: [],
        recentXPGains: [],
        leaderboard: {
          score: 0,
          updated_at: new Date().toISOString()
        }
      }, selected_answer);

      // Update battle state with the answer
      dispatch({
        type: 'ANSWER_QUESTION',
        payload: {
          answer: selected_answer,
          isCorrect: selected_answer === state.battle?.questions[state.battle.current_question]?.correct_answer
        }
      });

      return battle_results;
    } catch (error) {
      console.error('Failed to calculate battle results:', error);
      throw error;
    }
  }, [state, dispatch]);

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
    is_bot: state.battle?.metadata?.is_bot || false
  };
}