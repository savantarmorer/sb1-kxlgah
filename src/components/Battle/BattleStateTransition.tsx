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

import React from 'react';
import { motion } from 'framer-motion';
import { Swords, AlertCircle } from 'lucide-react';
import { BattleStatus } from '../../types/battle';
import './BattleStateTransition.css';

// Animation variants
const containerVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1]
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.3 }
  }
};

const iconVariants = {
  initial: { scale: 0 },
  animate: {
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1]
    }
  },
  pulse: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export function BattleStateTransition({
  status,
  message,
  onComplete
}: {
  status: BattleStatus;
  message?: string;
  onComplete?: () => void;
}) {
  return (
    <div className="battle-transition">
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        onAnimationComplete={onComplete}
      >
        {/* Battle Preview */}
        {status === 'preparing' && (
          <div className="battle-preview">
            <div className="versus-container">
              <motion.div
                variants={iconVariants}
                animate="pulse"
                className="versus-icon"
              >
                <Swords size={48} />
              </motion.div>
              <motion.span className="versus-text">
                VS
              </motion.span>
            </div>
          </div>
        )}

        {/* Battle Status */}
        {status === 'active' && message && (
          <div className="battle-status">
            <motion.div className="status-text">
              {message}
            </motion.div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="battle-error">
            <motion.div
              variants={iconVariants}
              className="error-icon"
            >
              <AlertCircle size={48} className="text-red-500" />
            </motion.div>
            <motion.div className="error-text">
              {message || 'An error occurred'}
            </motion.div>
          </div>
        )}

        {/* Generic Message */}
        {message && !['preparing', 'active', 'error'].includes(status) && (
          <motion.div className="battle-message">
            {message}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
