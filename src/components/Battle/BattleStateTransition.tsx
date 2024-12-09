/**
 * BattleStateTransition Component
 * 
 * A visual component that handles transitions between different battle states.
 * It provides animated feedback to users about the current state of the battle.
 * 
 * Integration Points:
 * - Used by BattleMode component for state transitions
 * - Consumes BattleStatus from battle types
 * - Uses framer-motion for animations
 * 
 * Dependencies:
 * - framer-motion: For smooth state transitions
 * - lucide-react: For battle state icons
 * - BattleStatus type: From battle type definitions
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Timer, Trophy, Pause, AlertCircle } from 'lucide-react';
import { BattleStatus } from '../../types/battle';

// Component Props Interface
export interface BattleStateTransitionProps {
  status: BattleStatus;
  message?: string;
  onComplete?: () => void;
}

/**
 * Type for transition content structure
 */
type TransitionContent = {
  readonly [K in BattleStatus]: {
    readonly icon: JSX.Element;
    readonly defaultText: string;
    readonly defaultSubtext: string;
  }
};

/**
 * Transition content configuration for each battle state
 * Maps battle states to their visual representation
 */
const TRANSITION_CONTENT: TransitionContent = {
  idle: {
    icon: <Swords size={48} className="text-gray-400" />,
    defaultText: 'Ready to Battle',
    defaultSubtext: 'Start when you are ready'
  },
  searching: {
    icon: <Swords size={48} className="text-brand-teal-500 animate-pulse" />,
    defaultText: 'Finding Opponent...',
    defaultSubtext: 'Please wait'
  },
  preparing: {
    icon: <Swords size={48} className="text-brand-teal-500" />,
    defaultText: 'Preparing Battle...',
    defaultSubtext: 'Getting everything ready'
  },
  ready: {
    icon: <Swords size={48} className="text-brand-teal-500 animate-bounce" />,
    defaultText: 'Ready to Start!',
    defaultSubtext: 'Get ready for battle'
  },
  active: {
    icon: <Timer size={48} className="text-yellow-500" />,
    defaultText: 'Battle in Progress',
    defaultSubtext: 'Good luck!'
  },
  paused: {
    icon: <Pause size={48} className="text-yellow-500" />,
    defaultText: 'Battle Paused',
    defaultSubtext: 'Take a breather'
  },
  completed: {
    icon: <Trophy size={48} className="text-yellow-500" />,
    defaultText: 'Battle Complete',
    defaultSubtext: 'Calculating results...'
  },
  victory: {
    icon: <Trophy size={48} className="text-green-500 animate-bounce" />,
    defaultText: 'Victory!',
    defaultSubtext: 'Well played!'
  },
  defeat: {
    icon: <Trophy size={48} className="text-red-500" />,
    defaultText: 'Defeat',
    defaultSubtext: 'Better luck next time'
  },
  draw: {
    icon: <Trophy size={48} className="text-yellow-500" />,
    defaultText: 'Draw',
    defaultSubtext: 'A close match!'
  },
  error: {
    icon: <AlertCircle size={48} className="text-red-500" />,
    defaultText: 'Battle Error',
    defaultSubtext: 'Something went wrong'
  }
};

export function BattleStateTransition({ 
  status, 
  message,
  onComplete 
}: BattleStateTransitionProps) {
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    if (status === 'completed' && !hasCompleted) {
      setHasCompleted(true);
      onComplete?.();
    }
  }, [status, onComplete, hasCompleted]);

  // Render different content based on status
  const renderContent = () => {
    switch (status) {
      case 'searching':
        return (
          <div className="battle-transition searching">
            <div className="spinner" />
            <p>Finding opponent...</p>
          </div>
        );

      case 'ready':
        return (
          <div className="battle-transition ready">
            <div className="countdown">
              <p>Battle starting in...</p>
              <div className="timer">3</div>
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="battle-transition completed">
            <Trophy className="trophy-icon" />
            <h2>Battle Complete</h2>
            <p>Calculating results...</p>
          </div>
        );

      case 'error':
        return (
          <div className="battle-transition error">
            <p>Error: {message}</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      className="battle-state-transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {renderContent()}
    </motion.div>
  );
}

// Export for use in other components
export default BattleStateTransition;
