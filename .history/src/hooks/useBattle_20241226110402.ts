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
  BattleStateEnum,
  Card,
  PlayerState,
  BattleStatus,
  BattleResults,
  BattleRewards,
  BattleInitPayload
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

  // Track if battle system is ready
  const [phase, setPhase] = useState<BattleStateEnum>(BattleStateEnum.INITIALIZING);
  const [currentQuestion, setCurrentQuestion] = useState<BattleQuestion | null>(null);
  const [timeLeft, setTimeLeft] = useState(BATTLE_CONFIG.time_per_question);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [currentDamage, setCurrentDamage] = useState(0);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [streak, setStreak] = useState(0);
  const [playerState, setPlayerState] = useState<PlayerState>({ health: BATTLE_CONFIG.initial_health, shield: 0, isReady: false });
  const [opponentState, setOpponentState] = useState<PlayerState>({ health: BATTLE_CONFIG.initial_health, shield: 0, isReady: false });

  // Validate phase transitions
  const validatePhaseTransition = useCallback((from: BattleStateEnum, to: BattleStateEnum): boolean => {
    const validTransitions: Record<BattleStateEnum, BattleStateEnum[]> = {
      [BattleStateEnum.IDLE]: [BattleStateEnum.INITIALIZING, BattleStateEnum.ERROR],
      [BattleStateEnum.INITIALIZING]: [BattleStateEnum.PREPARING, BattleStateEnum.ERROR],
      [BattleStateEnum.PREPARING]: [BattleStateEnum.DEALING, BattleStateEnum.ERROR],
      [BattleStateEnum.DEALING]: [BattleStateEnum.CARD_SELECTION, BattleStateEnum.ERROR],
      [BattleStateEnum.CARD_SELECTION]: [BattleStateEnum.CARD_REVEAL, BattleStateEnum.ERROR],
      [BattleStateEnum.CARD_REVEAL]: [BattleStateEnum.QUESTION, BattleStateEnum.ERROR],
      [BattleStateEnum.QUESTION]: [BattleStateEnum.RESOLUTION, BattleStateEnum.ERROR],
      [BattleStateEnum.RESOLUTION]: [BattleStateEnum.CARD_SELECTION, BattleStateEnum.COMPLETED, BattleStateEnum.ERROR],
      [BattleStateEnum.COMPLETED]: [BattleStateEnum.VICTORY, BattleStateEnum.DEFEAT, BattleStateEnum.DRAW, BattleStateEnum.ERROR],
      [BattleStateEnum.VICTORY]: [BattleStateEnum.IDLE],
      [BattleStateEnum.DEFEAT]: [BattleStateEnum.IDLE],
      [BattleStateEnum.DRAW]: [BattleStateEnum.IDLE],
      [BattleStateEnum.ERROR]: [BattleStateEnum.IDLE],
      [BattleStateEnum.ACTIVE]: [BattleStateEnum.DEALING, BattleStateEnum.COMPLETED, BattleStateEnum.ERROR]
    };

    const isValid = validTransitions[from]?.includes(to);
    if (!isValid) {
      console.error(`[useBattle] Invalid phase transition: ${from} -> ${to}`);
      console.debug('[useBattle] Valid transitions for', from, 'are:', validTransitions[from]);
    } else {
      console.debug(`[useBattle] Valid phase transition: ${from} -> ${to}`);
    }
    return isValid;
  }, []);

  // Override setPhase to enforce valid transitions
  const setPhaseWithValidation = useCallback(async (newPhase: BattleStateEnum): Promise<boolean> => {
    console.debug(`[useBattle] Attempting phase transition from ${phase} to ${newPhase}`);
    if (validatePhaseTransition(phase, newPhase)) {
      console.debug(`[useBattle] Phase transition validated: ${phase} -> ${newPhase}`);
      setPhase(newPhase);
      return true;
    }
    return false;
  }, [phase, validatePhaseTransition]);

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

  // Check if battle system is ready
  useEffect(() => {
    const checkSystemReady = () => {
      const systemConditions = {
        isAuthInitialized: authInitialized,
        isAuthLoaded: !isAuthLoading,
        hasUser: Boolean(user?.id || authUser?.id),
        hasStats: Boolean(state.battle_stats),
        hasGameState: Boolean(state.user)
      };

      const isSystemReady = Object.values(systemConditions).every(Boolean);
      console.debug('[useBattle] System conditions:', systemConditions);
      
      return isSystemReady;
    };

    // Initial check
    const isSystemReady = checkSystemReady();
    setIsReady(isSystemReady);

  }, [authInitialized, isAuthLoading, user, authUser, state.battle_stats, state.user]);

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

  // Watch for game state changes
  useEffect(() => {
    if (state.battle?.status === BattleStateEnum.ACTIVE && phase === BattleStateEnum.INITIALIZING) {
      console.debug('[useBattle] Game state activated, transitioning to CARD_SELECTION');
      setPhase(BattleStateEnum.CARD_SELECTION);
    }
  }, [state.battle?.status, phase]);

  // Watch for card selections and question transitions
  useEffect(() => {
    const handleCardSelectionComplete = async () => {
      if (phase === BattleStateEnum.CARD_SELECTION && selectedCard && opponentSelectedCard) {
        const currentQuestionIndex = state.battle?.current_question ?? 0;
        const question = state.battle?.questions?.[currentQuestionIndex];
        
        if (question) {
          console.debug('[useBattle] Both cards selected, transitioning to CARD_REVEAL phase', {
            currentQuestionIndex,
            question,
            selectedCard,
            opponentSelectedCard
          });
          
          // First transition to CARD_REVEAL
          const success = await setPhaseWithValidation(BattleStateEnum.CARD_REVEAL);
          if (success) {
            // Set the question after transitioning to CARD_REVEAL
            await setCurrentQuestion(question);
          } else {
          // Set question first, then transition phase to ensure proper order
          await setCurrentQuestion(question);
          setPhaseWithValidation(BattleStateEnum.QUESTION);
        } else {
          console.error('[useBattle] No question available for index:', currentQuestionIndex);
          showError(t('battle.error.no_question'));
          setPhase(BattleStateEnum.ERROR);
        }
      }
    };

    handleCardSelectionComplete();
  }, [phase, selectedCard, opponentSelectedCard, state.battle?.questions, state.battle?.current_question, setPhaseWithValidation, showError, t]);

  const initializeBattle = useCallback(async (options?: BattleOptions) => {
    try {
      // Force a ready check before proceeding
      const systemConditions = {
        isAuthInitialized: authInitialized,
        isAuthLoaded: !isAuthLoading,
        hasUser: Boolean(user?.id || authUser?.id),
        hasStats: Boolean(state.battle_stats),
        hasGameState: Boolean(state.user)
      };

      const isSystemReady = Object.values(systemConditions).every(Boolean);
      
      console.debug('[useBattle] Starting battle initialization...', { 
        isReady: isSystemReady,
        options,
        systemConditions,
        auth: { authInitialized, isAuthLoading, authUser },
        user: user,
        battleStats: state.battle_stats,
        gameState: state.user
      });
      
      if (!isSystemReady) {
        console.error('[useBattle] System conditions not met:', systemConditions);
        throw new Error('Battle system not ready - Required conditions not met');
      }

      // Reset any existing battle first and wait for completion
      console.debug('[useBattle] Resetting existing battle');
      await new Promise<void>(resolve => {
        dispatch({ type: 'RESET_BATTLE' });
        resolve();
      });
      
      // Set preparing status and wait for phase update
      await Promise.all([
        new Promise<void>(resolve => {
          dispatch({ type: 'SET_BATTLE_STATUS', payload: 'preparing' as BattleStatus });
          resolve();
        }),
        new Promise<void>(resolve => {
          setPhase(BattleStateEnum.PREPARING);
          resolve();
        })
      ]);

      play_sound('battle_start');

      // Initialize all battle components in sequence
      console.debug('[useBattle] Fetching battle questions...');
      const questions = await BattleService.fetch_battle_questions(options?.difficulty);
      
      // Initialize opponent in parallel with questions
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

      // Initialize battle state and wait for completion
      console.debug('[useBattle] Initializing battle state...');
      await new Promise<void>(resolve => {
        dispatch({
          type: 'INITIALIZE_BATTLE',
          payload: {
            questions,
            time_per_question: BATTLE_CONFIG.time_per_question,
            opponent,
            status: 'initializing' as BattleStatus
          }
        });
        resolve();
      });

      // Initialize cards and wait for completion
      console.debug('[useBattle] Initializing card decks...');
      await initializeDecks();
      await distributeCards();

      // Activate battle and wait for completion
      console.debug('[useBattle] Activating battle...');
      await new Promise<void>(resolve => {
        dispatch({ type: 'SET_BATTLE_STATUS', payload: 'active' as BattleStatus });
        resolve();
      });

      console.debug('[useBattle] Battle initialization complete');

    } catch (error) {
      console.error('[useBattle] Battle initialization failed:', error);
      await Promise.all([
        new Promise<void>(resolve => {
          dispatch({ type: 'SET_BATTLE_STATUS', payload: 'error' as BattleStatus });
          resolve();
        }),
        new Promise<void>(resolve => {
          setPhase(BattleStateEnum.ERROR);
          resolve();
        })
      ]);
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
      // Lock battle completion to prevent multiple calls
      if (state.battle?.status === BattleStateEnum.COMPLETED) {
        console.warn('[useBattle] Battle already completed');
        return;
      }

      // Set status to completing to prevent race conditions
      await new Promise<void>(resolve => {
        dispatch({ 
          type: 'SET_BATTLE_STATUS', 
          payload: 'completing' as BattleStatus 
        });
        resolve();
      });

      // Calculate complete battle rewards using LevelSystem
      const battle_rewards = LevelSystem.calculate_complete_battle_rewards(
        results.score.player,
        results.stats.total_questions,
        state.battle_stats?.difficulty || 1,
        state.user?.streak || 0,
        state.battle?.time_left || 0
      );

      // Update battle state with final results
      await new Promise<void>(resolve => {
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
        resolve();
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
        console.warn('[useBattle] Achievement check failed:', achievementError);
        // Don't throw here - we want to continue with battle completion
      }

      // Show battle completion notification and play sound in parallel
      await Promise.all([
        new Promise<void>(resolve => {
          const message = `${results.victory ? t('battle.victory') : t('battle.defeat')} - ${t('battle.completed')}`;
          showBattleNotification(message, results.victory);
          resolve();
        }),
        new Promise<void>(resolve => {
          play_sound(results.victory ? 'victory' : 'defeat');
          resolve();
        })
      ]);

    } catch (error) {
      console.error('[useBattle] Failed to handle battle completion:', error);
      
      // Set error state
      await Promise.all([
        new Promise<void>(resolve => {
          dispatch({ 
            type: 'SET_BATTLE_STATUS', 
            payload: 'error' as BattleStatus 
          });
          resolve();
        }),
        new Promise<void>(resolve => {
          setPhase(BattleStateEnum.ERROR);
          resolve();
        })
      ]);
      
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
        total_battles: state.battle_stats?.total_battles || 0,
        wins: state.battle_stats?.wins || 0,
        losses: state.battle_stats?.losses || 0,
        win_streak: state.battle_stats?.win_streak || 0,
        highest_streak: state.battle_stats?.highest_streak || 0,
        total_xp_earned: state.battle_stats?.total_xp_earned || 0,
        total_coins_earned: state.battle_stats?.total_coins_earned || 0,
        difficulty: state.battle_stats?.difficulty || 1
      };

      const current_question = state.battle?.questions[state.battle.current_question];
      if (!current_question) {
        throw new Error('No current question found');
      }

      // Check if the selected answer letter matches the correct answer letter
      const is_correct = selected_answer.toUpperCase() === current_question.correct_answer;
      console.debug('[useBattle] Answer result:', { is_correct });

      // Move to resolution phase first
      dispatch({ type: 'SET_BATTLE_PHASE', payload: BattleStateEnum.RESOLUTION });

      dispatch({
        type: 'ANSWER_QUESTION',
        payload: {
          answer: selected_answer,
          is_correct
        }
      });

      const battle_state: GameState = {
        ...state,
        battle: state.battle,
        battle_stats: current_battle_stats,
        user: state.user,
        recentXPGains: state.recentXPGains,
        leaderboard: state.leaderboard,
        login_history: state.login_history,
        achievements: state.achievements,
        quests: state.quests,
        inventory: state.inventory,
        statistics: state.statistics,
        error: state.error,
        loading: state.loading,
        syncing: state.syncing,
        showLevelUpReward: state.showLevelUpReward,
        current_levelRewards: state.current_levelRewards,
        activeEffects: state.activeEffects
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

  const handleAnswer = useCallback(async (answer: string) => {
    if (!currentQuestion || !selectedCard || !opponentSelectedCard) {
      console.error('[useBattle] Cannot handle answer - missing required state', {
        hasQuestion: !!currentQuestion,
        hasPlayerCard: !!selectedCard,
        hasOpponentCard: !!opponentSelectedCard
      });
      return;
    }

    if (phase !== BattleStateEnum.QUESTION) {
      console.error('[useBattle] Cannot handle answer - wrong phase:', phase);
      return;
    }

    try {
      // Lock the answer handling to prevent multiple submissions
      if (playerState.isReady) {
        console.warn('[useBattle] Answer already submitted');
        return;
      }

      // Set player as ready to prevent multiple submissions
      setPlayerState(prev => ({ ...prev, isReady: true }));

      const isCorrect = answer.toUpperCase() === currentQuestion.correct_answer.toUpperCase();
      await setIsAnswerCorrect(isCorrect);

      // Calculate rewards including card effects and time bonus
      const rewards = calculateBattleRewards(
        isCorrect,
        timeLeft,
        streak,
        (state.battle?.metadata?.difficulty as 'easy' | 'medium' | 'hard') || 'medium'
      );

      // Calculate damage based on card effects and correctness
      const playerCard = playerHand.find(c => c.id === selectedCard);
      const opponentCard = opponentHand.find(c => c.id === opponentSelectedCard);
      
      let damage = 0;
      if (isCorrect && playerCard) {
        damage = playerCard.power + (rewards.metadata?.damage_dealt || 0);
        
        // Apply card effects in sequence
        if (playerCard.effect) {
          const effect = {
            type: 'battle_boost',
            value: playerCard.power,
            metadata: {
              battle_only: true
            }
          } as ItemEffect;

          if (effect.type === 'battle_boost') {
            await new Promise<void>(resolve => {
              setPlayerState(prev => ({
                ...prev,
                shield: prev.shield + effect.value
              }));
              resolve();
            });
          }
        }
      }

      await setCurrentDamage(damage);

      // Update player states based on damage and effects in sequence
      await Promise.all([
        new Promise<void>(resolve => {
          setPlayerState(prev => ({
            ...prev,
            health: prev.health,
            shield: prev.shield + (rewards.metadata?.shield_gained || 0)
          }));
          resolve();
        }),
        new Promise<void>(resolve => {
          setOpponentState(prev => ({
            ...prev,
            health: Math.max(0, prev.health - damage),
            shield: prev.shield
          }));
          resolve();
        })
      ]);

      // Update score and streak in sequence
      if (isCorrect) {
        await Promise.all([
          new Promise<void>(resolve => {
            setScore(prev => ({ ...prev, player: prev.player + 1 }));
            resolve();
          }),
          new Promise<void>(resolve => {
            setStreak(prev => prev + 1);
            resolve();
          })
        ]);
        play_sound('correct');
      } else {
        await Promise.all([
          new Promise<void>(resolve => {
            setStreak(0);
            resolve();
          })
        ]);
        play_sound('wrong');
      }

      // Update battle state in database
      try {
        await answer_question(answer);
      } catch (error) {
        console.error('[useBattle] Failed to update battle state:', error);
        // Continue with the game even if database update fails
      }

      // Only transition to resolution after all updates are complete
      await setPhaseWithValidation(BattleStateEnum.RESOLUTION);

    } catch (error) {
      console.error('[useBattle] Answer handling failed:', error);
      showError(t('battle.error.answer_failed'));
      setPhase(BattleStateEnum.ERROR);
    } finally {
      // Reset ready state in case of error
      setPlayerState(prev => ({ ...prev, isReady: false }));
    }
  }, [currentQuestion, selectedCard, opponentSelectedCard, timeLeft, streak, play_sound, state.battle?.metadata?.difficulty, playerHand, opponentHand, answer_question, setPhaseWithValidation, showError, t, playerState.isReady]);

  const reset_battle = useCallback(() => {
    dispatch({ type: 'RESET_BATTLE' });
  }, [dispatch]);

  const handleResolutionComplete = useCallback(async () => {
    if (phase !== BattleStateEnum.RESOLUTION) {
      console.error('[useBattle] Cannot complete resolution - wrong phase:', phase);
      return;
    }

    try {
      // Check if battle is over
      if (opponentState.health <= 0 || playerState.health <= 0) {
        await setPhaseWithValidation(BattleStateEnum.COMPLETED);
        return;
      }

      // Get the next question
      const currentQuestionIndex = state.battle?.current_question ?? 0;
      const nextQuestionIndex = currentQuestionIndex + 1;
      const nextQuestion = state.battle?.questions?.[nextQuestionIndex];

      if (nextQuestion && state.battle) {
        // Reset all states before updating battle progress
        await Promise.all([
          new Promise<void>(resolve => {
            setSelectedAnswer('');
            resolve();
          }),
          new Promise<void>(resolve => {
            setIsAnswerCorrect(null);
            resolve();
          }),
          new Promise<void>(resolve => {
            setTimeLeft(BATTLE_CONFIG.time_per_question);
            resolve();
          })
        ]);

        // Update battle state with next question
        await new Promise<void>(resolve => {
          dispatch({
            type: 'UPDATE_BATTLE_PROGRESS',
            payload: {
              ...state.battle,
              current_question: nextQuestionIndex
            }
          });
          resolve();
        });

        // Distribute new cards
        await distributeCards();
        
        // Finally transition to card selection
        await setPhaseWithValidation(BattleStateEnum.CARD_SELECTION);
      } else {
        // No more questions, end the battle
        await setPhaseWithValidation(BattleStateEnum.COMPLETED);
      }
    } catch (error) {
      console.error('[useBattle] Resolution completion failed:', error);
      showError(t('battle.error.resolution'));
      setPhase(BattleStateEnum.ERROR);
    }
  }, [opponentState.health, playerState.health, distributeCards, state.battle, dispatch, setSelectedAnswer, setIsAnswerCorrect, setTimeLeft, setPhaseWithValidation, showError, t]);

  // Cleanup effect
  useEffect(() => {
    const controller = new AbortController();
    
    return () => {
      // Cancel any pending operations
      controller.abort();
      
      // Reset all state
      setPhase(BattleStateEnum.INITIALIZING);
      setCurrentQuestion(null);
      setTimeLeft(BATTLE_CONFIG.time_per_question);
      setSelectedAnswer('');
      setIsAnswerCorrect(null);
      setCurrentDamage(0);
      setScore({ player: 0, opponent: 0 });
      setStreak(0);
      setPlayerState({ health: BATTLE_CONFIG.initial_health, shield: 0, isReady: false });
      setOpponentState({ health: BATTLE_CONFIG.initial_health, shield: 0, isReady: false });
      
      // Reset battle in store
      dispatch({ type: 'RESET_BATTLE' });
      
      console.debug('[useBattle] Cleanup complete - all state reset');
    };
  }, [dispatch]);

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
    setPhaseWithValidation,
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