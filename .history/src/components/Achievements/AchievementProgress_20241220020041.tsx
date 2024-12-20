import React from 'react';
import { motion } from 'framer-motion';
import { Achievement } from '../../types/achievements';

interface AchievementProgressProps {
  achievement: Achievement;
}

export function AchievementProgress({ achievement }: AchievementProgressProps) {
  const getProgressColor = () => {
    if (achievement.unlocked) return 'bg-green-500 shadow-green-500/20';
    if (achievement.ready_to_claim) return 'bg-yellow-500 shadow-yellow-500/20';
    if (achievement.progress >= 75) return 'bg-blue-500 shadow-blue-500/20';
    if (achievement.progress >= 50) return 'bg-yellow-500 shadow-yellow-500/20';
    if (achievement.progress >= 25) return 'bg-orange-500 shadow-orange-500/20';
    return 'bg-gray-500';
  };

  const getStatusText = () => {
    if (achievement.unlocked) return 'Unlocked!';
    if (achievement.ready_to_claim) return 'Ready to claim!';
    if (achievement.progress > 0) return `${Math.round(achievement.progress)}% Complete`;
    return 'Not started';
  };

  const getStatusColor = () => {
    if (achievement.unlocked) return 'text-green-600 dark:text-green-400';
    if (achievement.ready_to_claim) return 'text-yellow-600 dark:text-yellow-400';
    if (achievement.progress > 0) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
        <span>Progress</span>
        <span>{Math.round(achievement.progress)}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getProgressColor()} rounded-full shadow-sm`}
          initial={{ width: 0 }}
          animate={{ width: `${achievement.progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-sm ${getStatusColor()} mt-1 font-medium`}
      >
        {getStatusText()}
      </motion.div>
    </div>
  );
} 