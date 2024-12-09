import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button, LinearProgress, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, Star, Shield, Zap } from 'lucide-react';
import Confetti from 'react-confetti';
import { useNavigate } from 'react-router-dom';

// Types
import { BattleQuestion, BattleState, BattleStatus } from '../../types/battle';
import { Reward } from '../../types/rewards';
import type { Quest } from '../../types/quests';
import { GameState } from '../../types/game';
import type { BattleResults as BattleResultsType } from '../../types/battle';
import type { battle_stats } from '../../types/database';

// Components
import { BattleLobby } from './BattleLobby';
import { Button as CustomButton } from '../Button';
import { Modal } from '../Modal';
import AdminPanel from '../admin/AdminPanel';
import { BattleResults } from './BattleResults';
import { BattleStateTransition } from './BattleStateTransition';
import { QuestionDisplay } from './QuestionDisplay';
import { ScoreDisplay } from './ScoreDisplay';
import Timer from './Timer';

// Contexts and Hooks
import { use_language } from '../../contexts/LanguageContext';
import { useBattle } from '../../hooks/useBattle';
import { useAdmin } from '../../hooks/useAdmin';
import { use_game } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';

// Utils and Config
import { GameConfig } from '../../config/gameConfig';
import { calculate_xp_reward, calculate_coin_reward, calculate_level_data } from '../../utils/gameUtils';
import { supabase } from '../../lib/supabaseClient';

interface BattleModeProps {
  on_close: () => void;
}

interface BattleErrorBoundaryProps {
  children: React.ReactNode;
  on_error: () => void;
  on_close: () => void;
}

interface BattleModeContentProps {
  on_close: () => void;
}

// Error boundary specifically for battle mode
class BattleErrorBoundary extends React.Component<BattleErrorBoundaryProps, { hasError: boolean }> {
  constructor(props: BattleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[BattleMode] Error caught by boundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
      timestamp: new Date().toISOString()
    });

    // Reset battle state and notify parent
    this.props.on_error();
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            Oops! Something went wrong in the battle.
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Don't worry, your progress has been saved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => {
                this.setState({ hasError: false });
                this.props.on_error();
              }}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              onClick={this.props.on_close}
            >
              Exit Battle
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Main battle mode content component
function BattleModeContent({ on_close }: BattleModeContentProps) {
  // Add state to track if rewards were already claimed
  const [rewards_claimed, set_rewards_claimed] = useState(false);
  // Add state to track if we're transitioning out
  const [is_transitioning, set_is_transitioning] = useState(false);
  // Add state to track if battle is completed
  const [battle_completed, set_battle_completed] = useState(false);
  // Add state to track if we're in lobby
  const [show_lobby, set_show_lobby] = useState(true);
  // Add state to track selected difficulty
  const [selected_difficulty, set_selected_difficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // 1. All context hooks first
  const { t } = use_language();
  const { isAdmin } = useAdmin();
  const { state, dispatch } = use_game();
  const { showError } = useNotification();
  const { 
    battle_state,
    initialize_battle,
    answer_question,
    reset_battle,
    get_current_question,
    get_battle_progress,
    get_battle_rewards
  } = useBattle();

  // 2. All useState hooks
  const [error, set_error] = useState<Error | null>(null);
  const [show_confetti, set_show_confetti] = useState(false);
  const [show_stats, set_show_stats] = useState(true);
  const [show_admin_panel, set_show_admin_panel] = useState(false);
  const [show_debug, set_show_debug] = useState(false);
  const [currentRewards, setRewards] = useState({
    xp_earned: 0,
    coins_earned: 0,
    streak_bonus: 0,
    time_bonus: 0
  });

  // Get current battle state
  const current_question = get_current_question();
  const battle_progress = get_battle_progress();
  const battle_rewards = get_battle_rewards();

  // Calculate total rewards including bonuses
  const total_xp = battle_rewards.xp_earned + battle_rewards.streak_bonus;

  // Calculate battle rewards with level data
  const xp_earned = calculate_xp_reward(
    total_xp * (battle_progress.score.player / battle_progress.total_questions), 
    battle_progress.total_questions, 
    state.user.streak || 0
  );

  const rewards = {
    xp_earned,
    coins_earned: battle_rewards.coins_earned,
    streak_bonus: battle_rewards.streak_bonus,
    time_bonus: battle_rewards.time_bonus,
    level_data: calculate_level_data((state.user?.xp || 0) + xp_earned)
  };

  // 3. All useEffect hooks
  useEffect(() => {
    let is_mounted = true;

    const start_battle = async () => {
      try {
        if (!battle_state || battle_state.status === 'idle') {
          reset_battle();
          set_rewards_claimed(false);
          set_is_transitioning(false);
          await initialize_battle({
            is_bot: true,
            difficulty: 'medium'
          });
          if (is_mounted) {
            set_show_stats(false);
          }
        }
      } catch (err) {
        if (is_mounted) {
          console.error('[BattleMode] Battle initialization error:', err);
          set_error(err instanceof Error ? err : new Error('Failed to start battle'));
        }
      }
    };

    start_battle();

    return () => {
      is_mounted = false;
      set_rewards_claimed(false);
      set_is_transitioning(false);
      set_show_stats(false);
      set_show_confetti(false);
    };
  }, [battle_state, initialize_battle, reset_battle]);

  useEffect(() => {
    if (battle_state?.status === 'completed') {
      const { player, opponent } = battle_state.score;
      if (player > opponent) {
        set_show_confetti(true);
        setTimeout(() => set_show_confetti(false), 5000);
      }
      set_show_stats(true);
    }
  }, [battle_state?.status, battle_state?.score]);

  useEffect(() => {
    if (battle_state?.status === 'completed') {
      setRewards({
        xp_earned: battle_rewards.xp_earned,
        coins_earned: battle_rewards.coins_earned,
        streak_bonus: battle_rewards.streak_bonus,
        time_bonus: battle_rewards.time_bonus
      });
    }
  }, [battle_state?.status, battle_rewards?.xp_earned, battle_rewards?.coins_earned, battle_rewards?.streak_bonus, battle_rewards?.time_bonus]);

  useEffect(() => {
    if (battle_state?.status === 'error' && battle_state.error) {
      set_error(new Error(battle_state.error.message));
      showError(`Battle Error: ${battle_state.error.message}`);
    }
  }, [battle_state, showError]);

  // 4. All useCallback hooks
  const handle_error = useCallback(() => {
    reset_battle();
  }, [reset_battle]);

  const handle_play_again = useCallback(async () => {
    if (!rewards_claimed) {
      showError('Please claim your rewards first');
      return;
    }
    
    set_rewards_claimed(false);
    set_is_transitioning(false);
    reset_battle();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await initialize_battle({
      is_bot: true,
      difficulty: 'medium'
    });
    set_show_stats(false);
  }, [initialize_battle, reset_battle, rewards_claimed, showError]);

  const on_UPDATE_QUESTs = useCallback((quests: Quest[]) => {
    dispatch({ 
      type: 'UPDATE_QUEST_PROGRESS', 
      payload: { 
        questId: quests[0]?.id || '',
        progress: quests[0]?.progress || 0
      } 
    });
  }, [dispatch]);

  // Handle answer selection
  const handle_answer_selection = useCallback(async (selected_answer: string) => {
    if (!battle_state) {
      console.error('Cannot answer question: No battle state');
      return;
    }

    // Initialize battle stats if they don't exist
    if (!state.battle_stats) {
      dispatch({
        type: 'UPDATE_BATTLE_STATS',
        payload: {
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
        }
      });
      // Wait for state update to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    try {
      const battle_results = await answer_question(selected_answer);

      // Show battle results if this was the last question
      if (battle_results) {
        set_show_stats(true);
      }
    } catch (err) {
      console.error('[BattleMode] Error handling answer:', err);
      set_error(err instanceof Error ? err : new Error('Failed to process answer'));
    }
  }, [battle_state, answer_question, state.battle_stats, state.user.id, dispatch]);

  /**
   * BattleProgressState tracks the ongoing battle rewards and progress
   * 
   * Dependencies:
   * - Used by handle_battle_completion for reward calculations
   * - Integrates with battle_rewards from BattleState
   * - Used by UI components to display progress
   * 
   * Integration Points:
   * - BattleResults component
   * - Progress tracking system
   * - Achievement system
   */
  interface BattleProgressState {
    streak_bonus: number;      // Current streak multiplier bonus
    xp_gained: number;         // Total XP earned in battle
    coins_earned: number;      // Total coins earned in battle
    time_bonus?: number;       // Optional time completion bonus
    combo_multiplier?: number; // Optional combo streak multiplier
  }

  /**
   * Handles the completion of a battle, processing rewards and updating database state
   * 
   * @param battle_results - Resultados da batalha concluída
   * @returns Resultados aprimorados da batalha, incluindo dados de progressão de nvel
   * @throws Erro se as operações de banco de dados falharem
   */
  const handle_battle_completion = async (battle_results: BattleResultsType) => {
    const battle_progress = get_battle_progress();
    const battle_rewards = get_battle_rewards();
    
    // Initialize battle stats if they don't exist
    if (!state.battle_stats) {
      dispatch({
        type: 'UPDATE_BATTLE_STATS',
        payload: {
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
        }
      });
    }

    // Create progress state to track rewards
    const progressState: BattleProgressState = {
      streak_bonus: battle_rewards.streak_bonus,
      xp_gained: battle_rewards.xp_earned,
      coins_earned: battle_rewards.coins_earned,
      time_bonus: battle_rewards.time_bonus
    };

    try {
      console.log('Starting battle completion with results:', battle_results);
      
      const { data: transaction_data, error: transaction_error } = await supabase.rpc(
        'update_battle_progress_v2',
        { 
          p_user_id: battle_results.user_id,
          p_xp_earned: progressState.xp_gained,
          p_coins_earned: progressState.coins_earned,
          p_streak_bonus: progressState.streak_bonus,
          p_is_victory: battle_results.victory,
          p_questions_answered: battle_results.questions_answered,
          p_correct_answers: battle_results.correct_answers,
          p_time_spent: battle_results.time_spent,
          p_difficulty: battle_results.difficulty || 1
        }
      );

      console.log('Transaction result:', { transaction_data, transaction_error });

      if (transaction_error) throw transaction_error;

      // After successful update, fetch the latest profile data
      const { data: profile_data, error: profile_error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', battle_results.user_id)
        .single();

      console.log('Profile data after update:', { profile_data, profile_error });

      if (profile_error) throw profile_error;

      // Update global state with new profile data
      dispatch({
        type: 'UPDATE_USER',
        payload: profile_data
      });

      // Update battle state with final results
      dispatch({ 
        type: 'END_BATTLE',
        payload: {
          status: 'completed',
          score: {
            player: battle_results.player_score,
            opponent: battle_results.opponent_score
          },
          rewards: {
            xp_earned: progressState.xp_gained,
            coins_earned: progressState.coins_earned,
            streak_bonus: progressState.streak_bonus,
            time_bonus: (battle_state?.time_left || 0) * GameConfig.battle.time_bonus_factor
          }
        }
      });

    } catch (error) {
      console.error('Battle completion processing failed:', error);
      throw error;
    }
  };

  // Handle continue action
  const handle_continue = async () => {
    if (!battle_state) return;
    
    if (battle_state.status === 'completed') {
      if (rewards_claimed || is_transitioning) {
        return;
      }

      try {
        set_is_transitioning(true);
        set_rewards_claimed(true);

        const battle_results = {
          user_id: state.user.id,
          opponent_id: state.battle?.opponent?.id || 'unknown',
          winner_id: (state.battle?.score?.player || 0) > (state.battle?.score?.opponent || 0) 
            ? state.user.id 
            : state.battle?.opponent?.id || 'unknown',
          score_player: state.battle?.score?.player || 0,
          score_opponent: state.battle?.score?.opponent || 0,
          isVictory: (state.battle?.score?.player || 0) > (state.battle?.score?.opponent || 0),
          is_bot_opponent: state.battle?.opponent?.is_bot ?? true,
          current_question: battle_progress.current_question,
          total_questions: battle_progress.total_questions,
          time_left: battle_progress.time_left,
          score: {
            player: battle_progress.score.player,
            opponent: battle_progress.score.opponent
          },
          coins_earned: calculate_coin_reward(
            total_xp * (battle_progress.score.player / battle_progress.total_questions),
            battle_progress.total_questions,
            state.user.streak || 0
          ),
          streak_bonus: state.user.streak || 0,
          difficulty: 1,
          player_score: battle_progress.score.player,
          opponent_score: battle_progress.score.opponent,
          is_victory: battle_progress.score.player > battle_progress.score.opponent,
          xp_earned: calculate_xp_reward(
            total_xp * (battle_progress.score.player / battle_progress.total_questions),
            battle_progress.total_questions,
            state.user.streak || 0
          ),
          xp_gained: calculate_xp_reward(
            total_xp * (battle_progress.score.player / battle_progress.total_questions),
            battle_progress.total_questions,
            state.user.streak || 0
          ),
          victory: battle_progress.score.player > battle_progress.score.opponent,
          questions_answered: battle_progress.total_questions,
          correct_answers: battle_progress.score.player,
          time_spent: battle_state.time_per_question - battle_state.time_left
        };
        
        await handle_battle_completion(battle_results);
        
        // Reset battle state after rewards are claimed
        reset_battle();
        set_battle_completed(true);
        set_is_transitioning(false);
      } catch (error) {
        console.error('Error handling battle completion:', error);
        set_is_transitioning(false);
      }
    }
  };

  // Handle exit
  const handle_exit = useCallback(() => {
    if (!rewards_claimed && battle_completed) {
      showError('Please claim your rewards first');
      return;
    }
    set_is_transitioning(true);
    setTimeout(() => {
      on_close();
    }, 300);
  }, [rewards_claimed, battle_completed, on_close, showError]);

  const handle_start_battle = useCallback(async () => {
    try {
      set_show_lobby(false);
      await initialize_battle({
        is_bot: true,
        difficulty: selected_difficulty
      });
    } catch (error) {
      console.error('Failed to start battle:', error);
      showError('Failed to start battle');
      set_show_lobby(true);
    }
  }, [initialize_battle, selected_difficulty, showError]);

  const handle_return_to_lobby = useCallback(() => {
    if (!rewards_claimed && battle_completed) {
      showError('Please claim your rewards first');
      return;
    }
    reset_battle();
    set_show_lobby(true);
    set_rewards_claimed(false);
    set_is_transitioning(false);
    set_battle_completed(false);
  }, [rewards_claimed, battle_completed, reset_battle, showError]);

  // Add type guard for battle state
  const isBattleActive = battle_state && battle_state.status === 'active';
  const isBattleCompleted = battle_state && battle_state.status === 'completed';
  const isBattleError = battle_state && battle_state.status === 'error';

  // Update the stats interface to ensure all properties are non-nullable
  const battleStats = {
    total_battles: state.battle_stats?.total_battles ?? 0,
    wins: state.battle_stats?.wins ?? 0,
    losses: state.battle_stats?.losses ?? 0,
    win_streak: state.battle_stats?.win_streak ?? 0,
    highest_streak: state.battle_stats?.highest_streak ?? 0,
    average_score: state.battle_stats?.total_battles 
      ? Math.round((state.battle_stats.wins / state.battle_stats.total_battles) * 100)
      : 0
  } as const;

  // Ensure battle state is defined for AdminPanel
  const adminPanelState: GameState = {
    ...state,
    battle: state.battle || {
      status: 'idle',
      questions: [],
      current_question: 0,
      score: { player: 0, opponent: 0 },
      player_answers: [],
      time_left: 0,
      time_per_question: 0,
      in_progress: false,
      rewards: {
        xp_earned: 0,
        coins_earned: 0,
        streak_bonus: 0,
        time_bonus: 0
      },
      opponent: {
        id: 'bot-0',
        name: 'Bot',
        is_bot: true
      },
      metadata: {
        is_bot: true,
        difficulty: 1,
        mode: 'practice'
      }
    },
    // Ensure battle_stats is always defined
    battle_stats: state.battle_stats || {
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
    },
    // Ensure battleRatings is always defined
    battleRatings: state.battleRatings || {
      user_id: state.user.id,
      rating: 1000,
      wins: 0,
      losses: 0,
      streak: 0,
      highest_streak: 0,
      updated_at: new Date().toISOString()
    }
  };

  // Render loading state
  if (!battle_state && !show_lobby) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
          {t('battle.loading')}
        </Typography>
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('battle.error.title')}
        </Typography>
        <Typography color="error" sx={{ mb: 4 }}>
          {error.message}
        </Typography>
        <Button 
          variant="contained"
          onClick={handle_return_to_lobby}
        >
          {t('battle.return_to_lobby')}
        </Button>
      </Box>
    );
  }

  // Render lobby
  if (show_lobby) {
    return (
      <BattleLobby
        onStartBattle={handle_start_battle}
        onClose={on_close}
        stats={battleStats}
      />
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      <Box sx={{ flex: 1, p: 3 }}>
        {/* Battle header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4 
        }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {t('battle.title')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {isAdmin && (
              <Button
                variant="outlined"
                onClick={() => set_show_admin_panel(true)}
              >
                {t('admin.panel')}
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={handle_return_to_lobby}
              disabled={!rewards_claimed && battle_completed}
            >
              {t('battle.return_to_lobby')}
            </Button>
          </Box>
        </Box>

        {/* Battle content */}
        <Box sx={{ position: 'relative' }}>
          <AnimatePresence mode="wait">
            {battle_state && (
              <BattleStateTransition
                status={battle_state.status}
                message={isBattleError ? battle_state.error?.message : undefined}
                onComplete={() => {
                  if (isBattleCompleted && !rewards_claimed && !is_transitioning) {
                    set_battle_completed(true);
                  }
                }}
              />
            )}
          </AnimatePresence>

          {/* Battle progress */}
          {isBattleActive && (
            <Box sx={{ mb: 4 }}>
              <ScoreDisplay
                player_score={battle_progress.score.player}
                opponent_score={battle_progress.score.opponent}
                streak={state.user?.streak || 0}
                time_left={battle_progress.time_left}
              />
              <Timer
                time_left={battle_progress.time_left}
                total_time={GameConfig.battle.time_per_question}
              />
              <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
                {t('battle.question')} {battle_progress.current_question + 1} / {battle_progress.total_questions}
              </Typography>
            </Box>
          )}

          {/* Question display */}
          {current_question && isBattleActive && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <Card sx={{ 
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 3,
                overflow: 'visible',
                position: 'relative'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <QuestionDisplay
                    question={current_question}
                    on_answer={handle_answer_selection}
                    disabled={!isBattleActive}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Battle results */}
          {isBattleCompleted && (
            <>
              {show_confetti && <Confetti />}
              <AnimatePresence mode="wait">
                <BattleResults
                  score={battle_progress.score}
                  rewards={rewards}
                  stats={battleStats}
                  on_continue={handle_continue}
                  on_play_again={handle_play_again}
                  is_transitioning={is_transitioning}
                  rewards_claimed={rewards_claimed}
                />
              </AnimatePresence>
            </>
          )}

          {/* Handle battle errors */}
          {isBattleError && battle_state.error && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="error">
                Error: {battle_state.error.message}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Admin panel */}
      {show_admin_panel && (
        <Modal 
          is_open={show_admin_panel}
          on_close={() => set_show_admin_panel(false)}
          title="Battle Admin Panel"
        >
          <AdminPanel
            state={adminPanelState}
            quests={state.quests.active}
            on_UPDATE_QUESTs={on_UPDATE_QUESTs}
            on_close={on_close}
          />
        </Modal>
      )}
    </Box>
  );
}

// Main battle mode component with error boundary
export default function BattleMode({ on_close }: BattleModeProps) {
  const navigate = useNavigate();
  const { reset_battle } = useBattle(); 
  
  const handle_error = useCallback(() => {
    // Reset battle state on error
    reset_battle();
  }, [reset_battle]);

  const handleClose = () => {
    navigate('/');
  };

  return (
    <BattleErrorBoundary on_error={handle_error} on_close={handleClose}>
      <BattleModeContent on_close={handleClose} />
    </BattleErrorBoundary>
  );
}