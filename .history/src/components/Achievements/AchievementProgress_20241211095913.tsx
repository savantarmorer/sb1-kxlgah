import React from 'react';
import { motion } from 'framer-motion';
import { Achievement } from '../../types/achievements';

interface AchievementProgressProps {
  achievement: Achievement;
}

export function AchievementProgress({ achievement }: AchievementProgressProps) {
  const getProgressColor = () => {
    if (achievement.unlocked) return 'bg-green-500';
    if (achievement.progress >= 75) return 'bg-blue-500';
    if (achievement.progress >= 50) return 'bg-yellow-500';
    if (achievement.progress >= 25) return 'bg-orange-500';
    return 'bg-gray-500';
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
        <span>Progress</span>
        <span>{achievement.progress}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getProgressColor()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${achievement.progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {achievement.unlocked && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-green-600 dark:text-green-400 mt-1"
        >
          Achievement Unlocked!
        </motion.div>
      )}
    </div>
  );
} 