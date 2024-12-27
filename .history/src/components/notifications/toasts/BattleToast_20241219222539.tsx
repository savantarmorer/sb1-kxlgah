import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Trophy, Star } from 'lucide-react';
import { BattleResults } from '../../../types/battle';

export interface BattleToastProps {
  visible: boolean;
  result: BattleResults;
}

export function BattleToast({ visible, result }: BattleToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -20 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-[300px] border-l-4 ${
        result.victory ? 'border-green-500' : 'border-red-500'
      }`}
    >
      <div className="flex items-center space-x-3">
        {result.victory ? (
          <Trophy className="text-green-500" size={24} />
        ) : (
          <Swords className="text-red-500" size={24} />
        )}
        <div className="flex-1">
          <p className="font-medium text-gray-900 dark:text-white">
            {result.victory ? 'Victory!' : 'Battle Complete'}
          </p>
          <div className="flex items-center space-x-4 mt-1">
            <div className="flex items-center">
              <Star className="text-yellow-500" size={16} />
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                +{result.rewards.xp_earned} XP
              </span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Score: {result.stats.correct_answers}/{result.stats.total_questions}
            </span>
          </div>
          {result.rewards.streak_bonus > 0 && (
            <div className="text-sm text-orange-500 mt-1">
              +{result.rewards.streak_bonus} Streak Bonus!
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 

