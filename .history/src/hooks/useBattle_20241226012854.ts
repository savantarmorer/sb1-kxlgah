import { useCallback, useState } from 'react';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { useGame } from '../contexts/GameContext';
import { useBattleSound } from './useBattleSound';
import { useNotification } from '../contexts/NotificationContext';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { BattleService } from '../services/battleService';
import { LevelSystem } from '../lib/levelSystem';
import {
  BattleQuestion,
  BattlePhase,
  Card,
  PlayerState,
  BattleStatus,
  BattleResults
} from '../types/battle';
import { battle_statsDB } from '../types/battle/stats';
import { calculateBattleRewards, calculateBattleResults } from '../utils/battleUtils';
import { useCardBattle } from './useCardBattle';
import { useAchievements } from './useAchievements';

interface BattleOptions {
  opponent_id?: string;
  is_bot?: boolean;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export function useBattle() {
  const { state, dispatch } = useGame();
  const { play_sound } = useBattleSound();
  const { showError } = useNotification();
  const { t } = useTranslation();
  const { user: authUser, initialized: authInitialized, isLoading: isAuthLoading } = useAuth();
  const { check_achievements } = useAchievements();
  const user = state.user || authUser;
  const isReady = !isAuthLoading && authInitialized && !!user;

  // Integrate card battle hook
  const {
    playerHand,
    opponentHand,
    selectedCard,
    opponentSelectedCard,
    initializeDecks,
    selectCard,
    selectOpponentCard,
    distributeCards,
    removeUsedCards
  } = useCardBattle();

  // Track if battle system is ready
  const [phase, setPhase] = useState<BattlePhase>(BattlePhase.INITIALIZING);
  const [currentQuestion, setCurrentQuestion] = useState<BattleQuestion | null>(null);
  const [timeLeft, setTimeLeft] = useState(BATTLE_CONFIG.time_per_question);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [currentDamage, setCurrentDamage] = useState(0);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [streak, setStreak] = useState(0);
  const [playerState, setPlayerState] = useState<PlayerState>({ health: BATTLE_CONFIG.initial_health, shield: 0, isReady: false });
  const [opponentState, setOpponentState] = useState<PlayerState>({ health: BATTLE_CONFIG.initial_health, shield: 0, isReady: false });

  const showBattleNotification = useCallback((message: string, isSuccess = false) => {
    if (isSuccess) {
      showError(message);
    } else {
      showError(message);
    }
  }, [showError]);

  const initializeBattle = useCallback(async (options?: BattleOptions) => {
    if (!isReady) {
      throw new Error('Battle system not ready');
    }

    try {
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
        updated_at: new Date().toISOString()
      };

      const current_question = state.battle?.questions[state.battle.current_question];
      if (!current_question) {
        throw new Error('No current question found');
      }

      // Check if the selected answer letter matches the correct answer letter
      const is_correct = selected_answer.toUpperCase() === current_question.correct_answer;
      console.debug('[useBattle] Answer result:', { is_correct });

      // Move to resolution phase first
      dispatch({ type: 'SET_BATTLE_PHASE', payload: BattlePhase.RESOLUTION });

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

  const handleAnswer = useCallback((answer: string) => {
    if (!currentQuestion || !selectedCard || !opponentSelectedCard) return;

    const isCorrect = answer.toUpperCase() === currentQuestion.correct_answer.toUpperCase();
    setIsAnswerCorrect(isCorrect);

    // Calculate rewards including card effects
    const rewards = calculateBattleRewards(
      isCorrect,
      timeLeft,
      streak,
      state.battle?.metadata?.difficulty || 'medium'
    );

    // Update player states based on rewards metadata
    setPlayerState(prev => ({
      ...prev,
      health: prev.health,
      shield: prev.shield + (rewards.metadata?.shield_gained || 0)
    }));

    setOpponentState(prev => ({
      ...prev,
      health: prev.health - (rewards.metadata?.damage_dealt || 0),
      shield: prev.shield
    }));

    // Update score and streak
    if (isCorrect) {
      setScore(prev => ({ ...prev, player: prev.player + 1 }));
      setStreak(prev => prev + 1);
      play_sound('correct');
    } else {
      setStreak(0);
      play_sound('wrong');
    }

    // Move to resolution phase
    setPhase(BattlePhase.RESOLUTION);
    
    // Remove used cards
    removeUsedCards();
  }, [currentQuestion, selectedCard, opponentSelectedCard, timeLeft, streak, play_sound, removeUsedCards, state.battle?.metadata?.difficulty]);

  const handleResolutionComplete = useCallback(() => {
    // Check if battle is over
    if (opponentState.health <= 0 || playerState.health <= 0) {
      setPhase(BattlePhase.COMPLETED);
      return;
    }

    // Move to card selection phase
    setPhase(BattlePhase.CARD_SELECTION);
    
    // Distribute new cards if needed
    distributeCards();
    
    // Reset for next round
    setSelectedAnswer('');
    setIsAnswerCorrect(null);
    setTimeLeft(BATTLE_CONFIG.time_per_question);
  }, [opponentState.health, playerState.health, distributeCards]);

  return {
    phase,
    currentQuestion,
    timeLeft,
    selectedAnswer,
    isAnswerCorrect,
    currentDamage,
    score,
    streak,
    playerState,
    opponentState,
    playerHand,
    opponentHand,
    selectedCard,
    opponentSelectedCard,
    handleAnswer,
    handleResolutionComplete,
    initializeBattle,
    selectCard,
    selectOpponentCard,
    setTimeLeft,
    setPhase,
    answer_question,
    handle_battle_completion,
    reset_battle
  };
}