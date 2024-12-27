import { useCallback, useState, useEffect } from 'react';
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
  BattleResults,
  BattleRewards
} from '../types/battle';
import { battle_statsDB } from '../types/battle/stats';
import { calculateBattleRewards, calculateBattleResults } from '../utils/battleUtils';
import { useCardBattle } from './useCardBattle';
import { useAchievements } from './useAchievements';
import { GameState } from '../types/game';
import { ItemEffect } from '../types/items';

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
  const [isReady, setIsReady] = useState(false);

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

    let checkInterval: NodeJS.Timeout | null = null;

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

      if (isStateSynced) {
        // Clear interval if state is synced
        if (checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
        }
        return;
      }

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
    };

    // Initial check
    checkReady();

    // Set up periodic checks only if not synced
    if (!isReady) {
      checkInterval = setInterval(checkReady, 1000);
    }

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [authUser, user, isAuthLoading, authInitialized, showError, t, state.battle_stats, dispatch, isReady]);

  const get_battle_rewards = useCallback((): BattleRewards => {
    if (!state.battle?.rewards) {
      return {
        xp_earned: 0,
        coins_earned: 0,
        streak_bonus: 0,
        time_bonus: 0,
        total_xp: 0,
        total_coins: 0
      };
    }
    return state.battle.rewards;
  }, [state.battle?.rewards]);

  const calculate_xp_gained = useCallback((score: number, total_questions: number): number => {
    const difficulty = state.battle?.metadata?.difficulty || 'medium';
    const streak_multiplier = state.user?.streak || 0;
    
    const rewards = calculateBattleRewards(
      score > 0,  // isCorrect
      state.battle?.time_left || 0,  // timeLeft
      streak_multiplier,
      difficulty
    );
    
    return rewards.xp_earned;
  }, [state.battle?.metadata?.difficulty, state.battle?.time_left, state.user?.streak]);

  const calculate_coins_earned = useCallback((score: number, total_questions: number): number => {
    const difficulty = state.battle?.metadata?.difficulty || 'medium';
    const streak_multiplier = state.user?.streak || 0;
    
    const rewards = calculateBattleRewards(
      score > 0,  // isCorrect
      state.battle?.time_left || 0,  // timeLeft
      streak_multiplier,
      difficulty
    );
    
    return rewards.coins_earned;
  }, [state.battle?.metadata?.difficulty, state.battle?.time_left, state.user?.streak]);

  const showBattleNotification = useCallback((message: string, isVictory?: boolean) => {
    if (isVictory === undefined) {
      showError(message);
    } else {
      showError(message);
    }
  }, [showError]);

  // Watch for question changes and handle phase transitions
  useEffect(() => {
    if (currentQuestion && phase === BattlePhase.CARD_SELECTION) {
      setPhase(BattlePhase.QUESTION);
    }
  }, [currentQuestion, phase]);

  const initializeBattle = useCallback(async (options?: BattleOptions) => {
    try {
      setPhase(BattlePhase.PREPARING);
      
      console.debug('[useBattle] Starting battle initialization...', { isReady, options });
      
      if (!isReady) {
        console.error('[useBattle] Battle system not ready');
        throw new Error('Battle system not ready');
      }

      // Reset any existing battle first
      console.debug('[useBattle] Resetting existing battle');
      dispatch({ type: 'RESET_BATTLE' });
      
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'preparing' as BattleStatus });
      play_sound('battle_start');

      console.debug('[useBattle] Fetching battle questions...');
      const questions = await BattleService.fetch_battle_questions(options?.difficulty);
      
      console.debug('[useBattle] Questions fetched successfully', {
        count: questions.length,
        difficulty: options?.difficulty,
        questions
      });

      // Initialize opponent
      console.debug('[useBattle] Initializing opponent...');
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

      console.debug('[useBattle] Opponent initialized', {
        is_bot: options?.is_bot,
        opponent
      });

      // Initialize battle with questions and opponent
      console.debug('[useBattle] Dispatching INITIALIZE_BATTLE');
      dispatch({
        type: 'INITIALIZE_BATTLE',
        payload: {
          questions,
          time_per_question: BATTLE_CONFIG.time_per_question,
          opponent
        }
      });

      // Initialize card decks
      console.debug('[useBattle] Initializing card decks');
      await initializeDecks();

      // Distribute initial cards
      console.debug('[useBattle] Distributing initial cards');
      await distributeCards();

      // Set battle to active state after initialization
      console.debug('[useBattle] Setting battle status to active');
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'active' as BattleStatus });
      setPhase(BattlePhase.CARD_SELECTION);

      console.debug('[useBattle] Battle activated successfully');

    } catch (error) {
      console.error('[useBattle] Battle initialization failed:', error);
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'error' as BattleStatus });
      setPhase(BattlePhase.ERROR);
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

  const handleAnswer = useCallback(async (answer: string) => {
    if (!currentQuestion || !selectedCard || !opponentSelectedCard) return;

    const isCorrect = answer.toUpperCase() === currentQuestion.correct_answer.toUpperCase();
    setIsAnswerCorrect(isCorrect);

    // Calculate rewards including card effects and time bonus
    const rewards = calculateBattleRewards(
      isCorrect,
      timeLeft,
      streak,
      state.battle?.metadata?.difficulty || 'medium'
    );

    // Calculate damage based on card effects and correctness
    const playerCard = playerHand.find(c => c.id === selectedCard);
    const opponentCard = opponentHand.find(c => c.id === opponentSelectedCard);
    
    let damage = 0;
    if (isCorrect && playerCard) {
      damage = playerCard.power + (rewards.metadata?.damage_dealt || 0);
      
      // Apply card effects
      if (playerCard.effect) {
        const effect = {
          type: 'battle_boost',
          value: playerCard.power,
          metadata: {
            battle_only: true
          }
        } as ItemEffect;

        if (effect.type === 'battle_boost') {
          setPlayerState(prev => ({
            ...prev,
            shield: prev.shield + effect.value
          }));
        }
      }
    }

    setCurrentDamage(damage);

    // Update player states based on damage and effects
    setPlayerState(prev => ({
      ...prev,
      health: prev.health,
      shield: prev.shield + (rewards.metadata?.shield_gained || 0)
    }));

    setOpponentState(prev => ({
      ...prev,
      health: Math.max(0, prev.health - damage),
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

    // Update battle state in database
    try {
      await answer_question(answer);
    } catch (error) {
      console.error('[useBattle] Failed to update battle state:', error);
    }

    // Move to resolution phase
    setPhase(BattlePhase.RESOLUTION);
    
    // Remove used cards and reset states
    removeUsedCards();
    setTimeLeft(BATTLE_CONFIG.time_per_question); // Reset time for next question
  }, [currentQuestion, selectedCard, opponentSelectedCard, timeLeft, streak, play_sound, removeUsedCards, state.battle?.metadata?.difficulty, playerHand, opponentHand, answer_question]);

  const reset_battle = useCallback(() => {
    dispatch({ type: 'RESET_BATTLE' });
  }, [dispatch]);

  const handleResolutionComplete = useCallback(() => {
    // Check if battle is over
    if (opponentState.health <= 0 || playerState.health <= 0) {
      setPhase(BattlePhase.COMPLETED);
      return;
    }

    // Get the next question
    const currentQuestionIndex = state.battle?.current_question ?? 0;
    const nextQuestionIndex = currentQuestionIndex + 1;
    const nextQuestion = state.battle?.questions?.[nextQuestionIndex];

    if (nextQuestion && state.battle) {
      // Update battle state with next question
      dispatch({
        type: 'INITIALIZE_BATTLE',
        payload: {
          ...state.battle,
          current_question: nextQuestionIndex
        }
      });

      // Reset states for next round
      setSelectedAnswer('');
      setIsAnswerCorrect(null);
      setTimeLeft(BATTLE_CONFIG.time_per_question);
      
      // Distribute new cards and transition to card selection
      distributeCards();
      setPhase(BattlePhase.CARD_SELECTION);
    } else {
      // No more questions, end the battle
      setPhase(BattlePhase.COMPLETED);
    }
  }, [opponentState.health, playerState.health, distributeCards, state.battle, dispatch, setSelectedAnswer, setIsAnswerCorrect, setTimeLeft]);

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
    setCurrentQuestion,
    answer_question,
    handle_battle_completion,
    reset_battle,
    get_battle_rewards,
    calculate_xp_gained,
    calculate_coins_earned,
    isReady
  };
}