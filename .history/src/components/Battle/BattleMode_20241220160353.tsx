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
import { BattlePhase } from '../../types/battle';
import type { 
  BattleQuestion, 
  BattleState,
  BattleStateWithMetadata,
  BattleStatus,
  BattlePlayerState,
  BattleScore,
  BattleRewards,
  ExtendedBattleState,
  BattleMetadata,
  BattleOpponent,
  BattleError,
  BattleProgressState
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

// Component interfaces
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

// Helper functions
const isBotBattle = (state: BattleStateWithMetadata | null): boolean => {
  return Boolean(state?.metadata?.is_bot);
};

const handleError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error);
};

const castBattleState = (state: BattleState | null): BattleStateWithMetadata | null => {
  if (!state) return null;

  const defaultMetadata: BattleMetadata = {
    player_states: {},
    is_bot: false,
    phase: BattlePhase.IDLE,
    started_at: new Date().toISOString(),
    time_per_question: 30
  };

  return {
    ...state,
    metadata: {
      ...defaultMetadata,
      ...state.metadata,
      player_states: state.metadata.player_states || {},
      is_bot: state.metadata.is_bot || false
    },
    time_per_question: state.metadata.time_per_question || 30,
    user: {
      id: Object.keys(state.metadata.player_states)[0] || '',
      xp: 0,
      streak: 0
    },
    opponent: state.opponent || null
  } as BattleStateWithMetadata;
};

const mapBattleRewards = (rewards: BattleRewards): BattleRewards => ({
  xp_earned: rewards.xp_earned,
  coins_earned: rewards.coins_earned,
  streak_bonus: rewards.streak_bonus,
  time_bonus: rewards.time_bonus
});

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

  // Get current battle state
  const battle_state = useMemo(() => 
    castBattleState(rawBattleState),
    [rawBattleState]
  );

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

  // Pre-battle state
  const [preBattleState, setPreBattleState] = useState<PreBattleState>({
    countdown: 5,
    playerReady: false,
    opponentReady: false
  });

  // Battle state checks
  const isBattleActive = battle_state?.status === ('active' as BattleStatus);
  const isBattleCompleted = battle_state?.status === ('completed' as BattleStatus);
  const isBattleError = battle_state?.status === ('error' as BattleStatus);
  const isMatchmaking = battle_state?.status === ('waiting' as BattleStatus);
  
  // Status message helper
  const getBattleStatusMessage = useCallback((status: BattleStatus): string => {
    switch (status) {
      case 'idle': return t('battle.idle');
      case 'active': return t('battle.active');
      case 'completed': return t('battle.completed');
      case 'victory': return t('battle.victory');
      case 'defeat': return t('battle.defeat');
      case 'draw': return t('battle.draw');
      case 'error': return t('battle.error');
      default: return '';
    }
  }, [t]);

  // ... rest of component implementation ...
}

export default BattleMode;