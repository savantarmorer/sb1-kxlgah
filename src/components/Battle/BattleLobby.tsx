import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, Trophy, Star, Shield, 
  Target, Zap, Crown, Users, 
  Timer, Medal, TrendingUp 
} from 'lucide-react';
import { Button } from '../Button';
import { use_game } from '../../contexts/GameContext';
import { BATTLE_CONFIG } from '../../config/battleConfig';

interface BattleLobbyProps {
  onStartBattle: () => void;
  onClose: () => void;
  stats: {
    total_battles: number;
    wins: number;
    losses: number;
    win_streak: number;
    highest_streak: number;
    average_score: number;
  };
}

export function BattleLobby({ onStartBattle, onClose, stats }: BattleLobbyProps) {
  const { state } = use_game();
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showRules, setShowRules] = useState(false);

  const winRate = stats.total_battles > 0 
    ? Math.round((stats.wins / stats.total_battles) * 100) 
    : 0;

  const difficultyConfig = {
    easy: {
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      borderColor: 'border-green-500',
      multiplier: '0.8x'
    },
    medium: {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      borderColor: 'border-yellow-500',
      multiplier: '1x'
    },
    hard: {
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      borderColor: 'border-red-500',
      multiplier: '1.5x'
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="battle-lobby max-w-4xl mx-auto p-6 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700"
    >
      {/* Header Section */}
      <div className="text-center mb-8">
        <motion.div 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="flex items-center justify-center gap-3 mb-2"
        >
          <Swords className="w-8 h-8 text-brand-teal-500" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Battle Arena</h2>
        </motion.div>
        <p className="text-gray-600 dark:text-gray-400">
          Test your knowledge in epic battles against other players
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="stat-card p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-200 dark:border-purple-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span className="font-semibold text-gray-900 dark:text-white">Win Rate</span>
          </div>
          <p className="text-2xl font-bold text-brand-teal-500">{winRate}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {stats.wins}W - {stats.losses}L
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="stat-card p-4 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 border border-orange-200 dark:border-orange-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-6 h-6 text-orange-500" />
            <span className="font-semibold text-gray-900 dark:text-white">Win Streak</span>
          </div>
          <p className="text-2xl font-bold text-orange-500">{stats.win_streak}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Best: {stats.highest_streak}
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="stat-card p-4 rounded-lg bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/30 dark:to-teal-900/30 border border-green-200 dark:border-green-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6 text-green-500" />
            <span className="font-semibold text-gray-900 dark:text-white">Avg Score</span>
          </div>
          <p className="text-2xl font-bold text-green-500">{stats.average_score}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {stats.total_battles} Total Battles
          </p>
        </motion.div>
      </div>

      {/* Difficulty Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Select Difficulty</h3>
        <div className="grid grid-cols-3 gap-4">
          {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
            <motion.button
              key={difficulty}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedDifficulty(difficulty)}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${selectedDifficulty === difficulty 
                  ? `${difficultyConfig[difficulty].borderColor} ${difficultyConfig[difficulty].bgColor}` 
                  : 'border-gray-200 dark:border-gray-700'}
              `}
            >
              <div className="text-center">
                <p className={`font-semibold capitalize ${difficultyConfig[difficulty].color}`}>
                  {difficulty}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Rewards {difficultyConfig[difficulty].multiplier}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Battle Rules */}
      <motion.div 
        className="mb-8"
        initial={false}
        animate={{ height: showRules ? 'auto' : '40px' }}
      >
        <button
          onClick={() => setShowRules(!showRules)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-brand-teal-500 dark:hover:text-brand-teal-400 transition-colors"
        >
          <Shield className="w-5 h-5" />
          <span className="font-medium">Battle Rules</span>
        </button>
        
        <AnimatePresence>
          {showRules && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Answer {BATTLE_CONFIG.questions_per_battle} questions correctly to win</li>
                <li>• Each question has a {BATTLE_CONFIG.time_per_question} second time limit</li>
                <li>• Earn bonus points for quick answers</li>
                <li>• Maintain your streak for bonus rewards</li>
                <li>• Higher difficulties offer better rewards</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 gap-4">
        <Button
          onClick={() => onStartBattle()}
          variant="primary"
          className="w-full flex items-center justify-center gap-2 py-3"
        >
          <Swords className="w-5 h-5" />
          Start Battle
        </Button>

        <Button
          onClick={onClose}
          variant="outline"
          className="w-full"
        >
          Return to Menu
        </Button>
      </div>
    </motion.div>
  );
} 