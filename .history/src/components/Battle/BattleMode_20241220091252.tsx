import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Button, Modal, Stack, LinearProgress } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
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
  const [preBattleState, setPreBattleState] = useState<PreBattleState>({
    countdown: 5,
    playerReady: false,
    opponentReady: false
  });

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

  // Handle exit
  const handle_exit = useCallback(() => {
    if (battle_state?.status === 'completed' && !rewards_claimed) {
      showError(t('battle.error.claim_rewards_first'));
      return;
    }
    reset_battle();
    on_close();
  }, [battle_state?.status, rewards_claimed, reset_battle, on_close, showError, t]);

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
              startIcon={<ArrowLeft />}
              disabled={!rewards_claimed && battle_state?.status === 'completed'}
              sx={{
                borderColor: 'white/20',
                color: 'white',
                '&:hover': {
                  bgcolor: 'white/10'
                }
              }}
            >
              {t('battle.exit')}
            </Button>
          </Box>
        </Box>
  
        {showLobby ? (
          <BattleLobby
            onStartBattle={() => initialize_battle({
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
          <Box sx={{ position: 'relative' }}>
            {/* Battle content will go here */}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default BattleMode;