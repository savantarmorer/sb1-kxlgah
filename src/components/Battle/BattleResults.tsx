import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Coins, Sparkles } from 'lucide-react';
import type { BattleResults as BattleResultsType } from '../../types/battle';
import { useGame } from '../../contexts/GameContext';
import { LevelSystem } from '../../lib/levelSystem';

// Animation variants
const containerVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1],
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.3 }
  }
};

const iconVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
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

// Separate animation for pulsing effect
const pulseAnimation = {
  scale: [1, 1.1, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

interface SlotMachineCounterProps {
  value: number;
  className?: string;
}

// Slot Machine Counter Component
const SlotMachineCounter: React.FC<SlotMachineCounterProps> = ({ value, className = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const prevValue = useRef(0);

  useEffect(() => {
    if (value !== prevValue.current) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setIsAnimating(false);
        setDisplayValue(value);
        prevValue.current = value;
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  if (isAnimating) {
    const numbers = Array.from({ length: 10 }, (_, i) => i);
    const finalDigits = value.toString().split('');
    
    return (
      <div className={`flex overflow-hidden font-mono text-2xl ${className}`}>
        {finalDigits.map((targetDigit, index) => (
          <div 
            key={index} 
            className="w-[1ch] h-8 flex items-center justify-center overflow-hidden"
          >
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: -((numbers.length * 2 + parseInt(targetDigit)) * 32) }}
              transition={{
                duration: 1.5,
                delay: index * 0.1,
                ease: [0.34, 1.56, 0.64, 1]
              }}
              className="flex flex-col items-center"
            >
              {/* Two full rotations of numbers */}
              {[...numbers, ...numbers, ...numbers].map((num, i) => (
                <div 
                  key={i} 
                  className="h-8 flex items-center justify-center font-bold"
                >
                  {num}
                </div>
              ))}
              {/* Final number */}
              <div className="h-8 flex items-center justify-center font-bold">
                {targetDigit}
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 1.2, color: "#10B981" }}
      animate={{ scale: 1, color: "currentColor" }}
      className={`font-mono text-2xl ${className}`}
    >
      {displayValue.toLocaleString()}
    </motion.div>
  );
};

interface SparkleEffectProps {
  active: boolean;
}

// Sparkle Effect Component
const SparkleEffect: React.FC<SparkleEffectProps> = ({ active }) => (
  <AnimatePresence>
    {active && (
      <motion.div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              scale: 0,
              opacity: 1,
              x: "50%",
              y: "50%"
            }}
            animate={{ 
              scale: [0, 1, 0],
              opacity: [1, 1, 0],
              x: ["50%", `${50 + (Math.random() * 100 - 50)}%`],
              y: ["50%", `${50 + (Math.random() * 100 - 50)}%`]
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.1,
              repeat: Infinity,
              repeatDelay: 1
            }}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full"
            style={{
              boxShadow: '0 0 8px 2px rgba(250, 204, 21, 0.4)'
            }}
          />
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);

interface RewardItemProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  delay?: number;
}

// Reward Item Component with enhanced animations
const RewardItem: React.FC<RewardItemProps> = ({ 
  icon: Icon, 
  label, 
  value, 
  color,
  delay = 0
}) => (
  <motion.div
    variants={iconVariants}
    initial="initial"
    animate="animate"
    className={`flex justify-between items-center p-4 ${color} rounded-lg relative overflow-hidden`}
    style={{ transition: `all 0.3s ease ${delay}s` }}
  >
    <div className="flex items-center gap-2">
      <motion.div
        variants={iconVariants}
        animate="pulse"
      >
        <Icon className="w-5 h-5" />
      </motion.div>
      <span>{label}</span>
    </div>
    <div className="font-bold flex items-center gap-1">
      +<SlotMachineCounter value={value} />
    </div>
    <motion.div
      className="absolute inset-0 bg-white"
      initial={{ x: '-100%' }}
      animate={{ x: '200%' }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        repeatDelay: 3,
        ease: "easeInOut"
      }}
      style={{ opacity: 0.1 }}
    />
  </motion.div>
);

interface BattleResultsProps {
  results: {
    victory: boolean;
    draw: boolean;
    score: {
      player: number;
      opponent: number;
    };
    rewards: {
      xp_earned: number;
      coins_earned: number;
      streak_bonus: number;
      time_bonus?: number;
    };
    stats: {
      time_taken: number;
      total_questions: number;
    };
  };
  onClose: () => void;
}

export const BattleResults: React.FC<BattleResultsProps> = ({ results, onClose }) => {
  const { state } = useGame();
  const [showSparkles, setShowSparkles] = useState(true);
  
  // Get values directly from results
  const { 
    victory,
    draw,
    score: { player: playerScore, opponent: opponentScore },
    rewards: { xp_earned, coins_earned, streak_bonus },
    stats: { time_taken, total_questions }
  } = results;

  // Calculate accuracy percentage
  const accuracy = Math.round((playerScore / total_questions) * 100);
  
  // Calculate average time per question
  const avgTimePerQuestion = time_taken / total_questions;
  
  // Calculate level progress
  const currentXp = Number(state.user?.xp || 0);
  const currentLevel = LevelSystem.calculate_level(currentXp);
  const newLevel = LevelSystem.calculate_level(currentXp + xp_earned);
  const progress = LevelSystem.calculate_progress(currentXp + xp_earned);

  useEffect(() => {
    // Disable sparkles after 3 seconds
    const timer = setTimeout(() => setShowSparkles(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg relative"
    >
      {/* Victory Sparkles */}
      {victory && <SparkleEffect active={showSparkles} />}

      {/* Battle Results Header */}
      <div className="text-center mb-8 relative">
        <motion.div
          variants={iconVariants}
          initial="initial"
          animate="animate"
          whileInView="pulse"
          className="relative inline-block"
        >
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${
            victory 
              ? 'text-yellow-500' 
              : draw 
                ? 'text-blue-500' 
                : 'text-gray-400'
          }`} />
        </motion.div>
        <motion.h1
          variants={iconVariants}
          initial="initial"
          animate="animate"
          className={`text-3xl font-bold bg-gradient-to-r ${
            victory 
              ? 'from-yellow-500 to-orange-500'
              : draw
                ? 'from-blue-500 to-indigo-500'
                : 'from-gray-500 to-gray-600'
          } bg-clip-text text-transparent`}
        >
          {victory ? 'Victory!' : draw ? 'Draw!' : 'Battle Complete!'}
        </motion.h1>
      </div>

      {/* Score Display */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-8"
      >
        <div className="text-3xl font-bold flex justify-center items-center gap-4">
          <SlotMachineCounter value={playerScore} className="text-indigo-500" />
          <span className="text-gray-400">-</span>
          <SlotMachineCounter value={opponentScore} className="text-red-500" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-sm text-gray-600 dark:text-gray-400"
        >
          {playerScore} / {total_questions} Correct ({accuracy}%)
        </motion.div>
      </motion.div>

      {/* Battle Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 gap-4 mb-8 text-center"
      >
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20">
          <div className="text-sm text-gray-600 dark:text-gray-400">Time Taken</div>
          <div className="font-bold text-lg">
            {(time_taken / 1000).toFixed(1)}s
          </div>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20">
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Time per Question</div>
          <div className="font-bold text-lg">
            {(avgTimePerQuestion / 1000).toFixed(1)}s
          </div>
        </div>
      </motion.div>

      {/* Rewards Section */}
      <div className="space-y-4 mb-8">
        <RewardItem
          icon={Star}
          label="XP Earned"
          value={xp_earned}
          color="bg-blue-50 dark:bg-blue-900/20"
          delay={0.4}
        />
        <RewardItem
          icon={Coins}
          label="Coins Earned"
          value={coins_earned}
          color="bg-yellow-50 dark:bg-yellow-900/20"
          delay={0.5}
        />
        {streak_bonus > 0 && (
          <RewardItem
            icon={Sparkles}
            label="Streak Bonus"
            value={streak_bonus}
            color="bg-purple-50 dark:bg-purple-900/20"
            delay={0.6}
          />
        )}
      </div>

      {/* Level Progress */}
      <div className="space-y-2 mb-8">
        <motion.div 
          variants={iconVariants}
          initial="initial"
          animate="animate"
          className="flex justify-between text-sm"
        >
          <span>Level {currentLevel}</span>
          <span>{Math.round(progress)}%</span>
        </motion.div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
          <motion.div
            variants={iconVariants}
            initial="initial"
            animate="animate"
            transition={{ 
              duration: 1.5,
              delay: 0.9,
              ease: [0.34, 1.56, 0.64, 1]
            }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 relative"
            style={{ width: `${progress}%` }}
          >
            <motion.div
              className="absolute right-0 top-0 h-full w-4 bg-white opacity-30"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 1,
                repeat: Infinity
              }}
            />
          </motion.div>
        </div>
        {newLevel > currentLevel && (
          <motion.div
            variants={iconVariants}
            initial="initial"
            animate="animate"
            className="text-center text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent"
          >
            Level Up! {currentLevel} → {newLevel}
          </motion.div>
        )}
      </div>

      {/* Continue Button */}
      <motion.button
        onClick={onClose}
        variants={iconVariants}
        initial="initial"
        animate="animate"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all duration-200 transform"
      >
        Continue
      </motion.button>
    </motion.div>
  );
};
