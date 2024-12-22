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
import { supabase } from '../lib/supabase';
import { ItemEffect } from '../types/items';

interface BattleOptions {
  opponent_id?: string;
  is_bot?: boolean;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface MultiplayerState {
  lastAnswers?: {
    player?: string;
    opponent?: string;
    correct?: string;
  };
  isWaiting?: boolean;
  showResults?: boolean;
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
      console.debug('[useBattle] Auth not ready yet:', {
        authInitialized,
        isAuthLoading
      });
      setIsReady(false);
      return;
    }

    const checkReady = () => {
      // Check auth state
      const hasAuthUser = !!authUser?.id;
      // Check game state
      const hasGameUser = !!user?.id;
      // Check sync between auth and game state
      const isStateSynced = hasAuthUser && hasGameUser && user.id === authUser.id;

      console.debug('[useBattle] Checking battle system readiness:', {
        hasAuthUser,
        hasGameUser,
        isStateSynced,
        authUserId: authUser?.id,
        gameUserId: user?.id,
        gameState: {
          battle_stats: state.battle_stats,
          battle: state.battle?.status
        }
      });

      setIsReady(isStateSynced);

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

  const [multiplayerState, setMultiplayerState] = useState<MultiplayerState>({});
  const [battleChannel, setBattleChannel] = useState<any>(null);

  // Handle multiplayer battle initialization
  useEffect(() => {
    if (!state.battle?.matchId || !user?.id) return;

    const initializeMultiplayerBattle = async () => {
      try {
        // Join battle channel
        const channel = supabase.channel(`battle:${state.battle.matchId}`);
        
        // Set up channel listeners
        channel
          .on('broadcast', { event: 'player_answer' }, ({ payload }) => {
            if (payload.playerId !== user.id) {
              setMultiplayerState(prev => ({
                ...prev,
                lastAnswers: {
                  ...prev.lastAnswers,
                  opponent: payload.answer
                },
                isWaiting: false
              }));
            }
          })
          .on('broadcast', { event: 'question_results' }, ({ payload }) => {
            const { currentQuestion, playerStates } = payload;
            setMultiplayerState(prev => ({
              ...prev,
              lastAnswers: {
                player: playerStates[user.id]?.answer,
                opponent: playerStates[state.battle.opponent?.id || '']?.answer,
                correct: currentQuestion.correct_answer
              },
              showResults: true
            }));
          })
          .on('broadcast', { event: 'next_question' }, () => {
            setMultiplayerState({
              isWaiting: false,
              showResults: false
            });
          });

        await channel.subscribe();
        setBattleChannel(channel);

      } catch (error) {
        console.error('Error initializing multiplayer battle:', error);
        showError(t('battle.error.multiplayer_init'));
      }
    };

    initializeMultiplayerBattle();

    return () => {
      if (battleChannel) {
        battleChannel.unsubscribe();
      }
    };
  }, [state.battle?.matchId, user?.id]);

  // Modify the existing answer_question function
  const answer_question = useCallback(async (selected_answer: string) => {
    if (!state.user?.id) {
      throw new Error('No authenticated user found');
    }

    try {
      if (state.battle?.matchId && battleChannel) {
        // Handle multiplayer answer
        await battleChannel.send({
          type: 'broadcast',
          event: 'player_answer',
          payload: {
            matchId: state.battle.matchId,
            playerId: state.user.id,
            answer: selected_answer,
            timeLeft: state.battle.time_left
          }
        });

        setMultiplayerState(prev => ({
          ...prev,
          lastAnswers: {
            ...prev.lastAnswers,
            player: selected_answer
          },
          isWaiting: true
        }));

        // Let the server handle score calculation
        return;
      }

      // Original single-player logic
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
  }, [state, dispatch, handle_battle_completion, showError, t, battleChannel]);

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

  const handle_item_effect = useCallback(async (effect: ItemEffect) => {
    if (!state.battle || state.battle.status !== 'active') {
      throw new Error('No active battle');
    }

    switch (effect.type) {
      case 'eliminate_wrong_answer': {
        const currentQuestion = state.battle.questions[state.battle.current_question];
        const correctAnswer = currentQuestion.correct_answer;
        const allOptions = ['A', 'B', 'C', 'D'];
        const wrongOptions = allOptions.filter(opt => opt !== correctAnswer);
        
        // Randomly select wrong answers to eliminate based on effect value
        const numToEliminate = Math.min(effect.value, wrongOptions.length);
        const shuffledWrong = wrongOptions.sort(() => Math.random() - 0.5);
        const toEliminate = shuffledWrong.slice(0, numToEliminate);
        
        // Update battle state with eliminated options
        dispatch({
          type: 'UPDATE_BATTLE_STATE',
          payload: {
            status: state.battle.status,
            questions: state.battle.questions,
            current_question: state.battle.current_question,
            score: state.battle.score,
            player_answers: state.battle.player_answers,
            time_left: state.battle.time_left,
            time_per_question: state.battle.time_per_question,
            in_progress: state.battle.in_progress,
            opponent: state.battle.opponent,
            error: state.battle.error,
            rewards: state.battle.rewards,
            metadata: {
              ...state.battle.metadata,
              eliminated_options: toEliminate
            }
          }
        });

        play_sound('effect_use');
        showSuccess(t('battle.item.wrong_answer_eliminated', { count: numToEliminate }));
        break;
      }
      // ... handle other effects ...
    }
  }, [state.battle, dispatch, play_sound, showSuccess, t]);

  return {
    initialize_battle,
    answer_question,
    reset_battle,
    get_current_question,
    get_battle_progress,
    get_battle_rewards,
    handle_item_effect,
    battle: state.battle,
    loading: isAuthLoading || !authInitialized,
    error: state.battle?.error,
    isReady,
    isMultiplayer: !!state.battle?.matchId,
    isWaiting: multiplayerState.isWaiting,
    showResults: multiplayerState.showResults,
    opponentAnswer: multiplayerState.lastAnswers?.opponent,
    correctAnswer: multiplayerState.lastAnswers?.correct
  };
}