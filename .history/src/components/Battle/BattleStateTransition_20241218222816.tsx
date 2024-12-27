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
import { 
  BattleStatus, 
  BotOpponent, 
  BattleState,
  BattleProgressState
} from '../../types/battle';
import { useGame } from '../../contexts/GameContext';
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
  win_streak?: number;
  is_bot: boolean;
}

interface PlayerCardProps {
  player: PlayerPreview;
  side: 'left' | 'right';
  isWinner?: boolean;
}

const PlayerCard = ({ player, side, isWinner }: PlayerCardProps) => (
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
        {(player.win_streak ?? 0) > 2 && (
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
}: {
  status: BattleStatus;
  message?: string;
  onComplete?: () => void;
}) {
  const { state } = useGame();
  const { current_streak } = useBattleStreak();
  const battle = state.battle;

  // Format player data
  const player: PlayerPreview = {
    id: state.user?.id || '',
    name: state.user?.name || 'Player',
    avatar_url: state.user?.avatar_url,
    level: Number(state.user?.level || 1),
    rating: Number(state.battle_stats?.rating || 1000),
    win_streak: Number(state.battle_stats?.win_streak || 0),
    is_bot: false
  };

  // Format opponent data
  const opponent: PlayerPreview | undefined = battle?.opponent ? {
    id: battle.opponent.id || 'bot',
    name: battle.opponent.name || 'Bot',
    avatar_url: battle.opponent.avatar_url,
    level: Number(battle.opponent.level || 1),
    rating: Number(battle.opponent.rating || 1000),
    win_streak: 0,
    is_bot: Boolean(battle.opponent.is_bot)
  } : undefined;

  // Format battle progress data
  const battleProgress = battle ? {
    correctAnswers: battle.player_answers.filter(Boolean).length,
    totalQuestions: battle.questions.length,
    timeLeft: Number(battle.time_left || 0),
    score: {
      player: Number(battle.score?.player || 0),
      opponent: Number(battle.score?.opponent || 0)
    }
  } : undefined;

  return (
    <div className="battle-transition">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        onAnimationComplete={onComplete}
      >
        {/* Battle Preview */}
        {status === 'preparing' && (
          <div className="battle-preview">
            <PlayerCard player={player} side="left" />
            <div className="versus-container">
              <motion.div
                variants={iconVariants}
                animate="pulse"
                className="versus-icon"
              >
                <Swords size={48} />
              </motion.div>
              <motion.span
                variants={textVariants}
                custom={2}
                className="versus-text"
              >
                VS
              </motion.span>
            </div>
            {opponent && <PlayerCard player={opponent} side="right" />}
          </div>
        )}

        {/* Battle Status */}
        {status === 'active' && battleProgress && (
          <div className="battle-status">
            <motion.div variants={textVariants} custom={0} className="status-text">
              Question {battleProgress.correctAnswers + 1} of {battleProgress.totalQuestions}
            </motion.div>
            <motion.div variants={textVariants} custom={1} className="score-text">
              Score: {battleProgress.score.player} - {battleProgress.score.opponent}
            </motion.div>
          </div>
        )}

        {/* Victory State */}
        {status === 'victory' && (
          <div className="battle-result victory">
            <motion.div
              variants={iconVariants}
              animate="pulse"
              className="result-icon"
            >
              <Trophy size={64} className="text-yellow-500" />
            </motion.div>
            <motion.div variants={textVariants} custom={0} className="result-text">
              Victory!
            </motion.div>
            {battle?.rewards && (
              <motion.div variants={textVariants} custom={1} className="rewards-text">
                +{battle.rewards.xp_earned} XP • +{battle.rewards.coins_earned} Coins
                {battle.rewards.streak_bonus > 0 && ` • x${battle.rewards.streak_bonus} Streak`}
              </motion.div>
            )}
          </div>
        )}

        {/* Defeat State */}
        {status === 'defeat' && (
          <div className="battle-result defeat">
            <motion.div
              variants={iconVariants}
              className="result-icon"
            >
              <Trophy size={64} className="text-gray-400" />
            </motion.div>
            <motion.div variants={textVariants} custom={0} className="result-text">
              Defeat
            </motion.div>
            <motion.div variants={textVariants} custom={1} className="subtext">
              Better luck next time!
            </motion.div>
          </div>
        )}

        {/* Draw State */}
        {status === 'draw' && (
          <div className="battle-result draw">
            <motion.div
              variants={iconVariants}
              className="result-icon"
            >
              <Trophy size={64} className="text-brand-teal-500" />
            </motion.div>
            <motion.div variants={textVariants} custom={0} className="result-text">
              Draw!
            </motion.div>
            <motion.div variants={textVariants} custom={1} className="subtext">
              A close battle!
            </motion.div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="battle-result error">
            <motion.div
              variants={iconVariants}
              className="result-icon"
            >
              <AlertCircle size={64} className="text-red-500" />
            </motion.div>
            <motion.div variants={textVariants} custom={0} className="result-text">
              Error Occurred
            </motion.div>
            <motion.div variants={textVariants} custom={1} className="subtext">
              {message || 'Please try again'}
            </motion.div>
          </div>
        )}

        {/* Generic Message */}
        {message && !['victory', 'defeat', 'draw', 'error'].includes(status) && (
          <motion.div
            variants={textVariants}
            custom={2}
            className="battle-message"
          >
            {message}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default BattleStateTransition;
