import React, { useState, useCallback, useEffect, useReducer, useContext } from 'react';
import { Box, Typography, Card, CardContent, Button, LinearProgress } from '@mui/material';
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
} from '../../types/battle';
import { BattlePhase } from '../../types/battle';
// Components
import { BattleResults as BattleResultsComponent } from './BattleResults';
import { BattleStateTransition } from './BattleStateTransition';
import { QuestionDisplay } from './QuestionDisplay';
import { ScoreDisplay } from './ScoreDisplay';
import Timer from './Timer';

// Contexts and Hooks
import { use_language } from '../../contexts/LanguageContext';
import { useBattle } from '../../hooks/useBattle';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';

// Utils
import { calculateBattleRewards, determineBattleStatus } from '../../utils/battleUtils';
import { handle_battle_results } from '../../services/battleService';
import { supabase } from '../../lib/supabase.ts';
import type { RealtimeChannel } from '@supabase/supabase-js';
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
  const xp_earned = LevelSystem.calculate_battle_reward(
    total_xp * (battle_progress.score.player / battle_progress.total_questions), 
    battle_progress.total_questions, 
    state.user?.streak ?? 0
  );

  const rewards = {
    xp_earned,
    coins_earned: battle_rewards.coins_earned,
    streak_bonus: battle_rewards.streak_bonus,
    time_bonus: battle_rewards.time_bonus,
    level_data: LevelSystem.calculate_level_data((state.user?.xp ?? 0) + xp_earned)
  };
  const [showLobby, setShowLobby] = useState(true);

  const start_battle = async (options: {
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    mode: 'casual' | 'ranked';
  }) => {
    try {
      // First reset the battle
      reset_battle();
      
      // Wait for a small delay to ensure battle system resets
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!is_battle_ready) {
        console.debug('[BattleMode] Waiting for battle system to be ready...');
        // Add a retry mechanism
        let retries = 0;
        const maxRetries = 5;
        
        while (!is_battle_ready && retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }
        
        if (!is_battle_ready) {
          throw new Error('Battle system failed to initialize');
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
  
  // Handle answer selection
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
  
  // Handle battle completion
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
  
      const currentScore = battle_state.score;
      const rewards = calculateBattleRewards(
        currentScore.player,
        battle_progress.total_questions,
        state.battle_stats?.difficulty || 1,
        state.user.streak ?? 0,
        battle_progress.time_left ?? 0
      );
  
      await handle_battle_results(
        state.user.id,
        battle_state,
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
    battle_progress,
    rewards_claimed,
    is_transitioning,
    state.battle_stats?.difficulty,
    state.user,
    updateState,
    reset_battle,
    setShowLobby
  ]);
  
  // Handle exit
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
  
  // Get battle status message
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

  useEffect(() => {
    if (!state.user?.id) return;

    // Subscribe to profile updates
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
              difficulty: state.battle_stats?.difficulty || 1
            }}
          />
        ) : (
          // Todo o conteúdo da batalha
          <Box sx={{ position: 'relative' }}>
            <AnimatePresence mode="wait">
              {battle_state && (
                <BattleStateTransition
                  status={battle_state.status}
                  message={isBattleError ? battle_state.error?.message : getBattleStatusMessage(battle_state.status)}
                  onComplete={() => {
                    if (isBattleCompleted && !rewards_claimed && !is_transitioning) {
                      handle_battle_completion();
                    }
                  }}
                />
              )}
            </AnimatePresence>
  
            {/* Battle progress */}
            {isBattleActive && (
              <Box sx={{ mb: 4 }}>
                <ScoreDisplay
                  score_player={battle_progress.score.player}
                  score_opponent={battle_progress.score.opponent}
                  streak={state.user?.streak || 0}
                  time_left={battle_progress.time_left}
                />
                <Timer
                  time_left={battle_progress.time_left}
                  total_time={BATTLE_CONFIG.time_per_question}
                />
                <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, color: 'gray.400' }}>
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
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  boxShadow: 3,
                  overflow: 'visible',
                  position: 'relative',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(12px)'
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
                  <BattleResultsComponent
                    results={{
                      victory: battle_progress.score.player > battle_progress.score.opponent,
                      draw: battle_progress.score.player === battle_progress.score.opponent,
                      score: battle_progress.score,
                      rewards: current_rewards,
                      stats: {
                        time_taken: BATTLE_CONFIG.time_per_question - battle_state.time_left,
                        total_questions: battle_progress.total_questions
                      }
                    }}
                    onClose={handle_battle_completion}
                  />
                </AnimatePresence>
              </>
            )}
  
            {/* Battle error */}
            {isBattleError && battle_state?.error && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography sx={{ color: 'error.main' }}>
                  {t('battle.error.message', { error: battle_state.error.message })}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default BattleMode;