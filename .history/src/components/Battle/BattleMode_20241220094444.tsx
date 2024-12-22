import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Modal, 
  Stack, 
  LinearProgress,
  Card,
  CardContent
} from '@mui/material';
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
  BattleScore as BattleScoreType,
  BattleResults
} from '../../types/battle';

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
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types/database';
import { LiveMatchmakingService } from '../../services/liveMatchmakingService';

// Define battle phases as enum
export enum BattlePhase {
  Waiting = 'waiting',
  Ready = 'ready',
  Active = 'active',
  Completed = 'completed'
}

interface BattleScore {
  player: number;
  opponent: number;
}

interface BattlePlayerState {
  answered: boolean;
  answer: string | null;
  score: number;
  correct_count?: number;
  time_bonus?: number;
}

interface BattleMetadata {
  is_bot?: boolean;
  questions?: BattleQuestion[];
  current_question?: number;
  player_states?: Record<string, BattlePlayerState>;
  started_at?: string;
  completed_at?: string;
  winner?: string | null;
  phase?: BattlePhase;
  [key: string]: any;
}

interface BattleError {
  message: string;
  timestamp: number;
}

interface ExtendedBattleState {
  questions: BattleQuestion[];
  current_question: number;
  player_states: Record<string, BattlePlayerState>;
  started_at: string;
  completed_at?: string;
  winner?: string | null;
  error?: BattleError | null;
  player_answers: Array<boolean>;
  is_bot?: boolean;
  metadata?: BattleMetadata;
  phase: BattlePhase;
  status: BattleStatus;
  score: BattleScore;
  time_left: number;
  opponent?: {
    id: string;
    name: string;
    level: number;
  };
  rewards?: BattleRewards;
  matchId?: string;
}

// Update BattleState interface to include phase
interface BattleStateWithPhase extends Omit<BattleState, 'metadata'> {
  metadata?: {
    phase?: BattlePhase;
    is_bot?: boolean;
    questions?: BattleQuestion[];
    current_question?: number;
    player_states?: Record<string, BattlePlayerState>;
    started_at?: string;
    completed_at?: string;
    winner?: string | null;
    [key: string]: any;
  };
}

// Helper function to safely check battle state
const isBotBattle = (state: ExtendedBattleState | null): boolean => {
  return Boolean(state?.metadata?.is_bot || state?.is_bot);
};

// Helper function to handle errors
const handleError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error);
};

// Helper function to safely cast battle state
const castBattleState = (state: BattleStateWithPhase | null): ExtendedBattleState | null => {
  if (!state) return null;

  const defaultState: Partial<ExtendedBattleState> = {
    questions: [],
    current_question: 0,
    player_states: {},
    started_at: new Date().toISOString(),
    phase: BattlePhase.Waiting,
    status: 'idle',
    score: { player: 0, opponent: 0 },
    time_left: 0,
    player_answers: []
  };
  
  const { error, metadata, ...rest } = state;
  const currentPhase = metadata?.phase || BattlePhase.Waiting;
  
  const extendedState: ExtendedBattleState = {
    ...defaultState,
    ...rest,
    phase: currentPhase,
    error: error ? { message: error, timestamp: Date.now() } : null,
    metadata: {
      ...metadata,
      phase: currentPhase,
      winner: metadata?.winner || null
    }
  } as ExtendedBattleState;

  return extendedState;
};

// Helper function to get player answers safely
const getPlayerAnswers = (state: ExtendedBattleState | null): boolean[] => {
  return state?.player_answers || [];
};

// Helper function to get battle score safely
const getBattleScore = (state: ExtendedBattleState | null): BattleScore => {
  return state?.score || { player: 0, opponent: 0 };
};

// Helper function to get battle status message
const getBattleStatusMessage = (error: string | null): string => {
  if (!error) return '';
  return error;
};

// Update component state helper with proper types
const updateState = (prev: BattleModeState, updates: Partial<BattleModeState>): BattleModeState => {
  return { ...prev, ...updates };
};

// Update pre-battle state helper with proper types
const updatePreBattleState = (prev: PreBattleState, updates: Partial<PreBattleState>): PreBattleState => {
  return { ...prev, ...updates };
};

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

interface PreBattleState {
  countdown: number;
  playerReady: boolean;
  opponentReady: boolean;
}

interface BattlePayload {
  playerId: string;
  answer?: string;
  timeLeft?: number;
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
    battle: rawBattleState,
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

  // UI state
  const [showLobby, setShowLobby] = useState(true);
  const [preBattleState, setPreBattleState] = useState<PreBattleState>({
    countdown: 5,
    playerReady: false,
    opponentReady: false
  });

  // Cast battle state to extended type
  const battle_state = useMemo(() => 
    castBattleState(rawBattleState as BattleStateWithPhase),
    [rawBattleState]
  );

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

  /**
   * Checks if the battle is completed
   */
  const isBattleCompleted = useCallback((state: ExtendedBattleState | null): boolean => {
    return state?.status === 'completed' || 
           state?.status === 'victory' || 
           state?.status === 'defeat' || 
           state?.status === 'draw';
  }, []);

  /**
   * Checks if the battle has an error
   */
  const isBattleError = useCallback((state: ExtendedBattleState | null): boolean => {
    return state?.status === 'error';
  }, []);

  /**
   * Checks if the battle is active
   */
  const isBattleActive = useCallback((state: ExtendedBattleState | null): boolean => {
    return state?.status === 'active';
  }, []);

  /**
   * Handles exiting the battle
   */
  const handle_exit = useCallback(() => {
    if (battle_state?.status === 'completed' && !rewards_claimed) {
      showError(t('battle.error.claim_rewards_first'));
      return;
    }
    reset_battle();
    on_close();
  }, [battle_state?.status, rewards_claimed, reset_battle, on_close, showError, t]);

  /**
   * Starts a new battle
   */
  const start_battle = useCallback(async (options: {
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
  }, [is_battle_ready, initialize_battle, reset_battle, setShowLobby, showError, t, updateState]);

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

  /**
   * Handles battle completion and rewards
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
        phase: BattlePhase.Completed,
        status: battle_state.status,
        time_left: battle_state.time_left,
        current_question: battle_state.current_question,
        total_questions: battle_progress.total_questions,
        score_player: battle_state.score.player,
        score_opponent: battle_state.score.opponent,
        metadata: {
          is_bot: battle_state.metadata?.is_bot,
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
    state.user?.id,
    rewards_claimed,
    is_transitioning,
    updateState,
    reset_battle,
    setShowLobby
  ]);
  
  /**
   * Handles answer selection during battle
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

  // Handle battle start confirmation
  const handleBattleConfirm = useCallback(async () => {
    if (!state.battle?.matchId || !state.user?.id) return;

    try {
      await LiveMatchmakingService.confirmPlayerReady(
        state.battle.matchId,
        state.user.id
      );
      setPreBattleState(prev => ({ ...prev, playerReady: true }));
    } catch (error) {
      console.error('[BattleMode] Error confirming ready:', error);
      showError(t('battle.error.ready_confirmation'));
    }
  }, [state.battle?.matchId, state.user?.id, showError, t]);

  // Listen for battle events
  useEffect(() => {
    if (!state.battle?.matchId) return;

    const channel = supabase.channel(`battle:${state.battle.matchId}`);
    
    channel
      .on('broadcast', { event: 'player_ready' }, ({ payload }: { payload: BattlePayload }) => {
        const isOpponent = payload.playerId !== state.user?.id;
        if (isOpponent) {
          setPreBattleState(prev => ({ ...prev, opponentReady: true }));
        }
      })
      .on('broadcast', { event: 'battle_start' }, () => {
        console.log('[BattleMode] Battle starting...');
        setShowLobby(false);
        dispatch({ 
          type: 'SET_BATTLE_STATUS', 
          payload: 'active' as BattleStatus
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [state.battle?.matchId, state.user?.id, dispatch]);

  // Handle countdown when both players are ready
  useEffect(() => {
    if (preBattleState.playerReady && preBattleState.opponentReady) {
      const timer = setInterval(() => {
        setPreBattleState(prev => {
          if (prev.countdown <= 1) {
            clearInterval(timer);
            return prev;
          }
          return { ...prev, countdown: prev.countdown - 1 };
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [preBattleState.playerReady, preBattleState.opponentReady]);

  // Render pre-battle modal
  const renderPreBattleModal = () => {
    if (!state.battle?.opponent || !state.user || state.battle.status !== 'matched') return null;

    const bothReady = preBattleState.playerReady && preBattleState.opponentReady;

    return (
      <Modal
        open={showLobby}
        onClose={() => {}}
        disableEscapeKeyDown
        aria-labelledby="pre-battle-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2
        }}>
          <Typography variant="h5" component="h2" align="center" gutterBottom id="pre-battle-modal">
            {bothReady 
              ? t('battle.pre_battle.starting_in', { seconds: preBattleState.countdown })
              : t('battle.pre_battle.title')}
          </Typography>

          <Stack spacing={4} sx={{ mt: 2 }}>
            <Stack 
              direction="row" 
              justifyContent="space-between" 
              alignItems="center"
              spacing={2}
            >
              <Stack alignItems="center" spacing={1}>
                <Box>
                  <Typography variant="h6">{state.user.name}</Typography>
                  <Typography variant="body2">Level {state.user.level}</Typography>
                </Box>
                {preBattleState.playerReady && (
                  <Typography sx={{ color: 'success.main' }}>
                    {t('battle.pre_battle.player_ready')}
                  </Typography>
                )}
              </Stack>

              <Typography variant="h4">VS</Typography>

              <Stack alignItems="center" spacing={1}>
                <Box>
                  <Typography variant="h6">{state.battle.opponent.name}</Typography>
                  <Typography variant="body2">Level {state.battle.opponent.level}</Typography>
                </Box>
                {preBattleState.opponentReady && (
                  <Typography sx={{ color: 'success.main' }}>
                    {t('battle.pre_battle.opponent_ready')}
                  </Typography>
                )}
              </Stack>
            </Stack>

            {bothReady ? (
              <Stack spacing={1}>
                <LinearProgress 
                  variant="determinate" 
                  value={(5 - preBattleState.countdown) * 20}
                />
                <Typography align="center">
                  {t('battle.pre_battle.prepare')}
                </Typography>
              </Stack>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleBattleConfirm}
                disabled={preBattleState.playerReady}
                fullWidth
              >
                {preBattleState.playerReady 
                  ? t('battle.pre_battle.waiting')
                  : t('battle.pre_battle.ready')}
              </Button>
            )}
          </Stack>
        </Box>
      </Modal>
    );
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      bgcolor: '#0f172a',
      color: 'white'
    }}>
      {renderPreBattleModal()}
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
                      user_id: state.user?.id || '',
                      score: battle_progress.score,
                      rewards: current_rewards,
                      stats: {
                        time_taken: BATTLE_CONFIG.time_per_question - battle_state.time_left,
                        total_questions: battle_progress.total_questions,
                        average_time: battle_progress.total_questions > 0 
                          ? (BATTLE_CONFIG.time_per_question - battle_state.time_left) / battle_progress.total_questions 
                          : 0,
                        correct_answers: battle_state.player_answers.filter(a => a).length
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