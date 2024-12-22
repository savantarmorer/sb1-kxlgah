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
 * Checks if the battle is completed
 * 
 * Role: Helper function to determine battle completion state
 * Dependencies: None
 * Used by: Battle UI components for conditional rendering
 */
const isBattleCompleted = (state: ExtendedBattleState | null): boolean => {
  return state?.status === 'completed' || 
         state?.status === 'victory' || 
         state?.status === 'defeat' || 
         state?.status === 'draw';
};

/**
 * Checks if the battle has an error
 * 
 * Role: Helper function to determine battle error state
 * Dependencies: None
 * Used by: Battle UI components for error handling
 */
const isBattleError = (state: ExtendedBattleState | null): boolean => {
  return state?.status === 'error';
};

/**
 * Checks if the battle is active
 * 
 * Role: Helper function to determine if battle is in progress
 * Dependencies: None
 * Used by: Battle UI components for conditional rendering
 */
const isBattleActive = (state: ExtendedBattleState | null): boolean => {
  return state?.status === 'active';
};

/**
 * Handles exiting the battle
 * 
 * Role: Cleanup function for battle exit
 * Dependencies:
 * - GameContext: For state management
 * - BattleService: For cleanup
 * Used by: Battle UI for exit handling
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
 * 
 * Role: Initializes a new battle session
 * Dependencies:
 * - BattleService: For battle initialization
 * - GameContext: For state management
 * - NotificationContext: For error handling
 * Used by: Battle UI for starting new battles
 */
const start_battle = useCallback(async (options: {
  category: string;
  difficulty: string;
  mode: string;
}) => {
  try {
    // Wait for battle system to be ready
    if (!is_battle_ready) {
      const maxRetries = 3;
      const baseDelay = 1000;
      let retries = 0;
      
      while (!is_battle_ready && retries < maxRetries) {
        const delay = baseDelay * Math.pow(2, retries);
        console.debug(`[BattleMode] Retry ${retries + 1}/${maxRetries}, waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      }
      
      if (!is_battle_ready) {
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
}, [is_battle_ready, initialize_battle, setShowLobby, showError, t, updateState]);

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
    difficulty: string;
    mode: string;
  }) => {
    try {
      // Wait for battle system to be ready
      if (!is_battle_ready) {
        const maxRetries = 3;
        const baseDelay = 1000;
        let retries = 0;
        
        while (!is_battle_ready && retries < maxRetries) {
          const delay = baseDelay * Math.pow(2, retries);
          console.debug(`[BattleMode] Retry ${retries + 1}/${maxRetries}, waiting ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
        }
        
        if (!is_battle_ready) {
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
  }, [is_battle_ready, initialize_battle, setShowLobby, showError, t, updateState]);

  // ... rest of the component code ...
}

export default BattleMode;