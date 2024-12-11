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
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Play, Trophy, AlertCircle, User, Star } from 'lucide-react';
import { BattleStatus, BattleState } from '../../types/battle/state';
import { use_game } from '../../contexts/GameContext';
import { useBattleStreak } from '../../hooks/useBattleStreak';
import './BattleStateTransition.css';

// Animation variants
const containerVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const cardVariants = {
  initial: (side: 'left' | 'right') => ({
    x: side === 'left' ? -100 : 100,
    opacity: 0
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  exit: (side: 'left' | 'right') => ({
    x: side === 'left' ? -100 : 100,
    opacity: 0,
    transition: { duration: 0.3 }
  })
};

const iconVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  },
  exit: { 
    scale: 0.8, 
    opacity: 0,
    transition: {
      duration: 0.3
    }
  },
  pulse: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

const textVariants = {
  initial: { opacity: 0, y: 10 },
  animate: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: delay * 0.2,
      ease: 'easeOut'
    }
  }),
  exit: { 
    opacity: 0, 
    y: -10,
    transition: {
      duration: 0.3
    }
  }
};

interface PlayerPreview {
  id: string;
  name: string;
  avatar_url?: string;
  level: number;
  rating: number;
  win_streak: number;
}

interface BattleStateTransitionProps {
  status: BattleStatus;
  message?: string;
  onComplete?: () => void;
}

const PlayerCard = ({ player, side, isWinner }: { 
  player: PlayerPreview; 
  side: 'left' | 'right';
  isWinner?: boolean;
}) => (
  <motion.div
    custom={side}
    variants={cardVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className={`player-card ${isWinner ? 'winner' : ''}`}
    data-side={side}
  >
    <motion.div 
      className="avatar-container"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
    >
      {player.avatar_url ? (
        <img src={player.avatar_url} alt={player.name} className="avatar-image" />
      ) : (
        <User className="avatar-placeholder" />
      )}
      <motion.div 
        className="level-badge"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        {player.level}
      </motion.div>
    </motion.div>
    
    <motion.div 
      className="player-info"
      variants={textVariants}
      custom={1}
    >
      <h3 className="player-name">{player.name}</h3>
      <div className="player-stats">
        <motion.div 
          className="rating"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Trophy size={16} />
          <span>{player.rating}</span>
        </motion.div>
        {player.win_streak > 2 && (
          <motion.div 
            className="streak"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Star size={16} className="text-orange-500" />
            <span>{player.win_streak}</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  </motion.div>
);

export function BattleStateTransition({
  status,
  message,
  onComplete
}: BattleStateTransitionProps) {
  const { state } = use_game();
  const { current_streak } = useBattleStreak();
  const battle = state.battle;

  const getStateContent = () => {
    switch (status) {
      case 'idle':
        return {
          icon: <Play className="text-brand-teal-500" size={48} />,
          text: 'Ready to Battle',
          subtext: 'Start when you are ready',
          animation: 'pulse'
        };
      case 'waiting':
      case 'searching':
        return {
          icon: <Swords className="text-brand-teal-500" size={48} />,
          text: 'Finding Opponent...',
          subtext: 'Please wait',
          animation: 'pulse'
        };
      case 'preparing':
        return {
          icon: <Swords className="text-brand-teal-500" size={48} />,
          text: 'Preparing Battle',
          subtext: 'Getting everything ready...',
          animation: 'pulse'
        };
      case 'ready':
        return {
          icon: <Swords className="text-brand-teal-500" size={48} />,
          text: 'Opponent Found!',
          subtext: 'Preparing battle...',
          animation: 'pulse'
        };
      case 'active':
        return {
          icon: <Swords className="text-brand-teal-500" size={48} />,
          text: 'Battle in Progress',
          subtext: `Score: ${battle?.score.player || 0} - ${battle?.score.opponent || 0}`
        };
      case 'paused':
        return {
          icon: <Swords className="text-brand-teal-500 opacity-50" size={48} />,
          text: 'Battle Paused',
          subtext: 'Resume when ready'
        };
      case 'victory':
        return {
          icon: <Trophy className="text-yellow-500" size={48} />,
          text: 'Victory!',
          subtext: battle?.rewards ? 
            `XP: +${battle.rewards.xp_earned} | Coins: +${battle.rewards.coins_earned}${
              battle.rewards.streak_bonus ? ` | Streak: ${current_streak}` : ''
            }` : 'Congratulations!'
        };
      case 'defeat':
        return {
          icon: <Trophy className="text-gray-400" size={48} />,
          text: 'Defeat',
          subtext: 'Better luck next time!'
        };
      case 'draw':
        return {
          icon: <Trophy className="text-brand-teal-500" size={48} />,
          text: 'Draw!',
          subtext: 'A close battle!'
        };
      case 'completed':
        return {
          icon: <Trophy className="text-brand-teal-500" size={48} />,
          text: 'Battle Complete',
          subtext: battle?.rewards ? 
            `XP: +${battle.rewards.xp_earned} | Coins: +${battle.rewards.coins_earned}${
              battle.rewards.streak_bonus ? ` | Streak: ${current_streak}` : ''
            }` : 'Battle Complete'
        };
      case 'error':
        return {
          icon: <AlertCircle className="text-red-500" size={48} />,
          text: 'Error Occurred',
          subtext: message || 'Please try again'
        };
      default:
        return {
          icon: <Swords className="text-brand-teal-500" size={48} />,
          text: 'Battle',
          subtext: 'Loading...'
        };
    }
  };

  const content = getStateContent();
  const playerScore = battle?.score.player ?? 0;
  const opponentScore = battle?.score.opponent ?? 0;

  return (
    <AnimatePresence mode="wait" onExitComplete={onComplete}>
      <motion.div
        key={status}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
        className="battle-transition"
        data-status={status}
      >
        <div className="battle-transition-content">
          {status === 'ready' && battle?.opponent ? (
            <motion.div 
              className="battle-preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <PlayerCard
                player={{
                  id: state.user.id,
                  name: state.user.name,
                  avatar_url: state.user.avatar_url,
                  level: state.user.level,
                  rating: state.battle_stats?.tournament_rating || 1000,
                  win_streak: current_streak
                }}
                side="left"
                isWinner={status === 'completed' && playerScore > opponentScore}
              />
              <motion.div 
                className="versus-container"
                variants={iconVariants}
                initial="initial"
                animate={content.animation === 'pulse' ? 'pulse' : 'animate'}
              >
                <Swords className="versus-icon" />
                <motion.span 
                  className="versus-text"
                  variants={textVariants}
                  custom={2}
                >
                  VS
                </motion.span>
              </motion.div>
              <PlayerCard
                player={{
                  id: battle.opponent.id,
                  name: battle.opponent.name,
                  avatar_url: battle.opponent.avatar_url,
                  level: battle.opponent.level,
                  rating: battle.opponent.rating,
                  win_streak: battle.opponent.win_streak || 0
                }}
                side="right"
                isWinner={status === 'completed' && opponentScore > playerScore}
              />
            </motion.div>
          ) : (
            <motion.div
              variants={iconVariants}
              initial="initial"
              animate={content.animation === 'pulse' ? 'pulse' : 'animate'}
            >
              {content.icon}
            </motion.div>
          )}
          <motion.h2 
            className="transition-text"
            variants={textVariants}
            custom={1}
          >
            {content.text}
          </motion.h2>
          <motion.p 
            className="transition-subtext"
            variants={textVariants}
            custom={2}
          >
            {content.subtext}
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default BattleStateTransition;
