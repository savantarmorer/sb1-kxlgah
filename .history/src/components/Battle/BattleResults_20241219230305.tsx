import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { BattleResults as BattleResultsType } from '../../types/battle';
import { useGame } from '../../contexts/GameContext';
import { LevelSystem } from '../../lib/levelSystem';

interface BattleResultsProps {
  results: BattleResultsType;
  onClose: () => void;
}

export function BattleResults({ results, onClose }: BattleResultsProps) {
  const { state } = useGame();
  
  // Ensure all values are properly formatted
  const xpEarned = Number(results.rewards.xp_earned || 0);
  const coinsEarned = Number(results.rewards.coins_earned || 0);
  const playerScore = Number(results.score.player || 0);
  const opponentScore = Number(results.score.opponent || 0);
  
  // Calculate level progress
  const currentXp = Number(state.user?.xp || 0);
  const currentLevel = LevelSystem.calculate_level(currentXp);
  const newLevel = LevelSystem.calculate_level(currentXp + xpEarned);
  const progress = LevelSystem.calculate_progress(currentXp + xpEarned);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
      {/* Battle Results Header */}
      <div className="text-center mb-8">
        <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {results.victory ? 'Victory!' : results.draw ? 'Draw!' : 'Battle Complete!'}
        </h1>
      </div>

      {/* Results Content */}
      <div className="space-y-6">
        {/* Score Display */}
        <div className="text-center">
          <div className="text-xl font-semibold">
            {playerScore} - {opponentScore}
          </div>
        </div>

        {/* Rewards Section */}
        <div className="grid gap-4">
          <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span>XP Earned</span>
            <span className="font-bold">+{xpEarned}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <span>Coins Earned</span>
            <span className="font-bold">+{coinsEarned}</span>
          </div>
          {results.rewards.streak_bonus > 0 && (
            <div className="flex justify-between items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <span>Streak Bonus</span>
              <span className="font-bold">+{results.rewards.streak_bonus}</span>
            </div>
          )}
          {results.rewards.time_bonus > 0 && (
            <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span>Time Bonus</span>
              <span className="font-bold">+{results.rewards.time_bonus}</span>
            </div>
          )}
        </div>

        {/* Level Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Level {currentLevel}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-indigo-500"
            />
          </div>
          {newLevel > currentLevel && (
            <div className="text-center text-green-500 font-medium mt-2">
              Level Up! {currentLevel} → {newLevel}
            </div>
          )}
        </div>

        {/* Continue Button */}
        <button
          onClick={onClose}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
