import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Confetti from 'react-confetti';
import { BATTLE_CONFIG } from '../../config/battleConfig';
import { LevelSystem } from '../../lib/levelSystem';
import { BattleLobby } from './BattleLobby';
// Types
import type { 
  BattleQuestion, 
  BattleState,
  BattleStatus,
  BattleRewards,
  BattleScore,
  BattleResults,
  EnhancedBattleState
} from '../../types/battle';
import { BattlePhase } from '../../types/battle';
import type { InventoryItem } from '../../types/items';

// Components
import { BattleResults as BattleResultsComponent } from './BattleResults';
import { BattleStateTransition } from './BattleStateTransition';
import { QuestionDisplay } from './QuestionDisplay';
import { ScoreDisplay } from './ScoreDisplay';
import Timer from './Timer';
import { BattleItemDisplay } from './BattleItemDisplay';

// Contexts and Hooks
import { use_language } from '../../contexts/LanguageContext';
import { useBattle } from '../../hooks/useBattle';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useInventory } from '../../hooks/useInventory';

// Utils
import { calculateBattleRewards, determineBattleStatus } from '../../utils/battleUtils';
import { handle_battle_results } from '../../services/battleService';
import { supabase } from '../../lib/supabase.ts';
import type { Profile } from '../../types/database';

interface BattleModeProps {
  on_close: () => void;
}

interface BattleModeState {
  error: Error | null;
  show_confetti: boolean;
  show_stats: boolean;
  show_admin_panel: boolean;
  show_debug: boolean;
  rewards_claimed: boolean;
  is_transitioning: boolean;
  current_rewards: BattleRewards;
}

/**
 * BattleMode Component
 * 
 * Role: Main battle interface component that manages battle flow and user interactions
 * 
 * Dependencies:
 * - GameContext: For game state management
 * - BattleService: For battle operations
 * - LevelSystem: For XP calculations
 * - NotificationContext: For user feedback
 * 
 * Database Integration:
 * - battle_history: Records battle results
 * - battle_stats: Updates player statistics
 * - profiles: Updates user XP/coins
 * 
 * Used By:
 * - Main game interface
 * - Tournament system
 * - Quest system
 */
export function BattleMode({ on_close }: BattleModeProps) {
  const { t } = use_language();
  const { state, dispatch } = useGame();
  const { showError } = useNotification();
  const { 
    battle: battle_state,
    initialize_battle,
    answer_question,
    reset_battle,
    get_current_question,
    get_battle_progress,
    get_battle_rewards,
    loading: battle_loading,
    isReady: is_battle_ready,
    error: battle_error
  } = useBattle();
  const { useItem } = useInventory();

  // Component state
  const [componentState, setComponentState] = useState<BattleModeState>({
    error: null,
    show_confetti: false,
    show_stats: false,
    show_admin_panel: false,
    show_debug: false,
    rewards_claimed: false,
    is_transitioning: false,
    current_rewards: {
      xp_earned: 0,
      coins_earned: 0,
      streak_bonus: 0,
      time_bonus: 0
    }
  });

  // Destructure component state for convenience
  const {
    error,
    show_confetti,
    show_stats,
    show_admin_panel,
    show_debug,
    rewards_claimed,
    is_transitioning,
    current_rewards
  } = componentState;

  // Update component state helper
  const updateState = useCallback((updates: Partial<BattleModeState>) => {
    setComponentState(prev => ({ ...prev, ...updates }));
  }, []);

  // Get current battle state
  const current_question = get_current_question();
  const battle_progress = get_battle_progress();
  const battle_rewards = get_battle_rewards();

  // Calculate total rewards including bonuses
  const total_xp = battle_rewards.xp_earned + battle_rewards.streak_bonus;

  // Calculate battle rewards with level data
  const xp_earned = useCallback(() => {
    try {
      if (battle_progress.total_questions === 0) return 0;
      
      return LevelSystem.calculate_battle_reward(
        total_xp * (battle_progress.score.player / battle_progress.total_questions), 
        battle_progress.total_questions, 
        state.user?.streak ?? 0
      );
    } catch (error) {
      console.error('[BattleMode] Error calculating XP:', error);
      return 0;
    }
  }, [total_xp, battle_progress, state.user?.streak]);

  const rewards = {
    xp_earned: xp_earned(),
    coins_earned: battle_rewards.coins_earned,
    streak_bonus: battle_rewards.streak_bonus,
    time_bonus: battle_rewards.time_bonus,
    level_data: LevelSystem.calculate_level_data((state.user?.xp ?? 0) + xp_earned())
  };

  const [showLobby, setShowLobby] = useState(true);

  /**
   * Starts a new battle with specified options
   * 
   * Role: Initializes battle state and prepares game for battle
   * Dependencies:
   * - BattleService: For fetching questions and initializing battle
   * - GameContext: For state management
   * - NotificationContext: For error handling
   */
  const start_battle = async (options: {
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    mode: 'casual' | 'ranked';
  }) => {
    try {
      // First reset the battle
      reset_battle();
      
      // Wait for a small delay to ensure battle system resets
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!is_battle_ready) {
        console.debug('[BattleMode] Waiting for battle system to be ready...');
        // Add a retry mechanism with exponential backoff
        let retries = 0;
        const maxRetries = 5;
        const baseDelay = 500;
        
        while (!is_battle_ready && retries < maxRetries) {
          const delay = baseDelay * Math.pow(2, retries);
          console.debug(`[BattleMode] Retry ${retries + 1}/${maxRetries}, waiting ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
        }
        
        if (!is_battle_ready) {
          console.error('[BattleMode] Battle system failed to initialize after retries');
          throw new Error('Battle system failed to initialize. Please try again.');
        }
      }

      // Update states before starting
      updateState({
        rewards_claimed: false,
        is_transitioning: false,
        show_stats: false
      });

      // Hide lobby and start battle
      setShowLobby(false);
      
      await initialize_battle({
        ...options,
        is_bot: true
      });

    } catch (err) {
      console.error('[BattleMode] Battle initialization error:', err);
      showError(t('battle.error.initialization'));
      
      // In case of error, return to lobby and update state
      setShowLobby(true);
      updateState({
        error: err instanceof Error ? err : new Error('Failed to start battle')
      });
    }
  };
  
  // Battle completion effect
  useEffect(() => {
    if (battle_state?.status === 'completed') {
      const { player, opponent } = battle_state.score;
      if (player > opponent) {
        updateState({ show_confetti: true });
        const timer = setTimeout(() => {
          updateState({ show_confetti: false });
        }, 5000);
        return () => clearTimeout(timer);
      }
      updateState({ show_stats: true });
    }
  }, [battle_state?.status, battle_state?.score, updateState]);
  
  // Battle rewards effect
  useEffect(() => {
    if (battle_state?.status === 'completed') {
      updateState({
        current_rewards: {
          xp_earned: battle_rewards.xp_earned,
          coins_earned: battle_rewards.coins_earned,
          streak_bonus: battle_rewards.streak_bonus,
          time_bonus: battle_rewards.time_bonus
        }
      });
    }
  }, [battle_state?.status, battle_rewards, updateState]);
  
  // Battle error effect
  useEffect(() => {
    if (battle_state?.status === 'error' && battle_state.error) {
      updateState({
        error: new Error(battle_state.error.message)
      });
      showError(`Battle Error: ${battle_state.error.message}`);
    }
  }, [battle_state, showError, updateState]);
  
  /**
   * Handles battle completion and rewards
   * 
   * Role: Processes battle results and updates user progress
   * Dependencies:
   * - BattleService: For processing results
   * - LevelSystem: For calculating rewards
   * - GameContext: For state updates
   * 
   * Database Impact:
   * - Updates battle_history
   * - Updates user_progress
   * - Updates battle_stats
   */
  const handle_battle_completion = useCallback(async () => {
    if (!battle_state || battle_state.status !== 'completed') return;
    if (rewards_claimed || is_transitioning) return;
  
    try {
      updateState({
        is_transitioning: true,
        rewards_claimed: true
      });
  
      if (!state.user?.id) {
        throw new Error('User ID is required');
      }

      // Map BattleState to EnhancedBattleState
      const enhancedBattleState: EnhancedBattleState = {
        phase: BattlePhase.COMPLETED,
        status: battle_state.status,
        time_left: battle_state.time_left,
        current_question: battle_state.current_question,
        total_questions: battle_progress.total_questions,
        score_player: battle_state.score.player,
        score_opponent: battle_state.score.opponent,
        metadata: {
          is_bot: battle_state.metadata.is_bot,
          opponent_id: battle_state.opponent?.id,
          time_taken: BATTLE_CONFIG.time_per_question - battle_state.time_left
        },
        rewards: {
          xp: rewards.xp_earned,
          coins: rewards.coins_earned
        }
      };
  
      await handle_battle_results(
        state.user.id,
        enhancedBattleState,
        {
          xp_earned: rewards.xp_earned,
          coins_earned: rewards.coins_earned,
          streak_bonus: rewards.streak_bonus
        }
      );
  
      setShowLobby(true);
      reset_battle();
      updateState({ is_transitioning: false });
    } catch (error) {
      console.error('[BattleMode] Error handling battle completion:', error);
      updateState({ 
        error: error instanceof Error ? error : new Error('Failed to complete battle'),
        is_transitioning: false 
      });
    }
  }, [
    battle_state,
    battle_progress.total_questions,
    rewards,
    battle_rewards.time_bonus,
    state.user?.id,
    rewards_claimed,
    is_transitioning,
    updateState,
    reset_battle,
    setShowLobby
  ]);
  
  /**
   * Handles answer selection during battle
   * 
   * Role: Processes user answers and updates battle state
   * Dependencies:
   * - BattleService: For answer validation
   * - GameContext: For state updates
   */
  const handle_answer_selection = useCallback(async (selected_answer: string) => {
    if (!battle_state) {
      console.error('[BattleMode] Cannot answer question: No battle state');
      return;
    }
  
    try {
      const battle_results = await answer_question(selected_answer);
      if (battle_results) {
        updateState({ show_stats: true });
      }
    } catch (err) {
      console.error('[BattleMode] Error handling answer:', err);
      updateState({
        error: err instanceof Error ? err : new Error('Failed to process answer')
      });
    }
  }, [battle_state, answer_question, updateState]);
  
  /**
   * Handles exiting the battle mode
   * 
   * Role: Manages clean exit from battle, ensuring rewards are claimed
   * Dependencies:
   * - NotificationContext: For warning messages
   */
  const handle_exit = useCallback(() => {
    if (!rewards_claimed && battle_state?.status === 'completed') {
      showError(t('battle.error.claim_rewards'));
      return;
    }
    updateState({ is_transitioning: true });
    setTimeout(on_close, 300);
  }, [rewards_claimed, battle_state?.status, showError, on_close, t]);
  
  // Battle state guards
  const isBattleActive = battle_state?.status === 'active';
  const isBattleCompleted = battle_state?.status === 'completed';
  const isBattleError = battle_state?.status === 'error';
  
  /**
   * Gets localized battle status message
   * 
   * Role: Provides consistent status messages across the UI
   * Dependencies:
   * - Translation system
   */
  const getBattleStatusMessage = useCallback((status: BattleStatus): string => {
    switch (status) {
      case 'idle': return t('battle.idle');
      case 'preparing': return t('battle.preparing');
      case 'active': return t('battle.active');
      case 'paused': return t('battle.paused');
      case 'completed': return t('battle.completed');
      case 'victory': return t('battle.victory');
      case 'defeat': return t('battle.defeat');
      case 'draw': return t('battle.draw');
      case 'error': return t('battle.error');
      default: return '';
    }
  }, [t]);

  // Profile updates subscription
  useEffect(() => {
    if (!state.user?.id) return;

    const channel = supabase.channel(`public:profiles:id=eq.${state.user.id}`);
    
    const subscription = channel
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${state.user.id}`
        }, 
        (payload) => {
          if (payload.new) {
            dispatch({
              type: 'UPDATE_USER_PROFILE',
              payload: payload.new as Profile
            });
          }
        }
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [state.user?.id, dispatch]);

  const handleUseItem = async (item: InventoryItem) => {
    if (!state.inventory || !state.user || !battle_state) return;

    try {
      // Use the item first
      await useItem(item);

      // Apply battle effects
      if (Array.isArray(item.effects)) {
        for (const effect of item.effects) {
          switch (effect.type) {
            case 'eliminate_wrong_answer':
              // Update the current question to eliminate wrong answers
              const currentQuestion = battle_state.questions[battle_state.current_question];
              if (currentQuestion) {
                const updatedQuestion = {
                  ...currentQuestion,
                  disabled_alternatives: Array(effect.value).fill(true)
                };
                const updatedQuestions = [...battle_state.questions];
                updatedQuestions[battle_state.current_question] = updatedQuestion;
                
                // Update the battle state
                dispatch({
                  type: 'ANSWER_QUESTION',
                  payload: {
                    is_correct: false,
                    time_taken: 0,
                    disabled_alternatives: Array(effect.value).fill(true)
                  }
                });
              }
              break;

            case 'time_bonus':
              // Add time to the current question
              const newTimeLeft = Math.min(
                battle_state.time_left + effect.value,
                battle_state.time_per_question
              );
              
              // Update the battle state with new time
              dispatch({
                type: 'BEGIN_BATTLE',
                payload: {
                  total_questions: battle_state.questions.length,
                  time_left: newTimeLeft
                }
              });
              break;

            case 'battle_hint':
              // Add hint to the current question
              const questionWithHint = battle_state.questions[battle_state.current_question];
              if (questionWithHint) {
                // Update the battle state
                dispatch({
                  type: 'ANSWER_QUESTION',
                  payload: {
                    is_correct: false,
                    time_taken: 0,
                    show_hint: true
                  }
                });
              }
              break;

            case 'battle_boost':
              // Apply score multiplier
              const newScore = {
                ...battle_state.score,
                player: Math.round(battle_state.score.player * (1 + effect.value / 100))
              };
              
              // Update the battle state with new score
              dispatch({
                type: 'COMPLETE_BATTLE',
                payload: {
                  is_victory: newScore.player > battle_state.score.opponent,
                  score_player: newScore.player,
                  score_opponent: battle_state.score.opponent,
                  rewards: {
                    xp: 0,
                    coins: 0
                  }
                }
              });
              break;
          }
        }
      }
    } catch (error) {
      showError(t('battle.item_use_error'));
    }
  };

  const isAnswering = isBattleActive && battle_state?.selectedAnswer === undefined;

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      bgcolor: '#0f172a',
      color: 'white'
    }}>
      <Box sx={{ flex: 1, p: 3 }}>
        {/* Battle header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4 
        }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
            {t('battle.title')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handle_exit}
              startIcon={<ArrowLeft className="text-white" />}
              disabled={!rewards_claimed && isBattleCompleted}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {t('battle.exit')}
            </Button>
          </Box>
        </Box>
  
        {showLobby ? (
          <BattleLobby
            onStartBattle={() => start_battle({
              category: 'all',
              difficulty: 'medium',
              mode: 'casual'
            })}
            onClose={on_close}
            stats={{
              total_battles: state.battle_stats?.total_battles || 0,
              wins: state.battle_stats?.wins || 0,
              losses: state.battle_stats?.losses || 0,
              win_streak: state.battle_stats?.win_streak || 0,
              highest_streak: state.battle_stats?.highest_streak || 0,
              difficulty: state.battle_stats?.difficulty || 1,
              average_score: state.battle_stats?.total_battles && state.battle_stats?.total_xp_earned
                ? Math.round((state.battle_stats.total_xp_earned / (state.battle_stats.total_battles * BATTLE_CONFIG.questions_per_battle * 10)) * 100)
                : 0
            }}
          />
        ) : (
          // Todo o conteúdo da batalha
          <Box sx={{ 
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {/* Main battle content */}
            <Box sx={{ 
              width: '100%',
              maxWidth: '800px',
              position: 'relative',
              zIndex: 1
            }}>
              <AnimatePresence mode="wait">
                {battle_state && (
                  <motion.div
                    key={battle_state.current_question}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <BattleStateTransition
                      status={battle_state.status}
                      message={getBattleStatusMessage(battle_state.status)}
                    />

                    {/* Battle content */}
                    {isBattleActive && (
                      <>
                        {/* ... existing battle content ... */}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>

            {/* Error message */}
            {isBattleError && battle_state?.error && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography sx={{ color: 'error.main' }}>
                  {t('battle.error.message', { error: battle_state.error.message })}
                </Typography>
              </Box>
            )}
  
            {/* Battle items */}
            <Box sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 10 }}>
              <BattleItemDisplay
                items={state.inventory?.items || []}
                onUseItem={(item) => {
                  handleUseItem(item);
                }}
                disabled={!isBattleActive || isAnswering}
              />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default BattleMode;