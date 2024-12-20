import React from 'react';
import { motion } from 'framer-motion';
import { Achievement } from '../../types/achievements';
import { AchievementProgress } from './AchievementProgress';
import { AchievementRequirements } from './AchievementRequirements';
import { Trophy, Lock } from 'lucide-react';

export interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const getRarityStyles = () => {
    switch (achievement.rarity) {
      case 'legendary':
        return {
          border: 'border-yellow-300',
          bg: 'from-yellow-50',
          icon: 'text-yellow-500',
          badge: 'bg-yellow-100 text-yellow-800'
        };
      case 'epic':
        return {
          border: 'border-purple-300',
          bg: 'from-purple-50',
          icon: 'text-purple-500',
          badge: 'bg-purple-100 text-purple-800'
        };
      case 'rare':
        return {
          border: 'border-blue-300',
          bg: 'from-blue-50',
          icon: 'text-blue-500',
          badge: 'bg-blue-100 text-blue-800'
        };
      default:
        return {
          border: 'border-gray-200',
          bg: 'from-gray-50',
          icon: 'text-gray-500',
          badge: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const styles = getRarityStyles();

  return (
    <motion.div
      className={`
        relative overflow-hidden
        rounded-lg border ${styles.border}
        ${achievement.unlocked 
          ? `bg-gradient-to-br ${styles.bg} to-white` 
          : 'bg-gray-50'
        }
        p-4 h-full
      `}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start gap-3">
        <div className={`
          p-2 rounded-lg ${achievement.unlocked ? styles.icon : 'text-gray-400'}
          ${achievement.unlocked ? 'bg-white' : 'bg-gray-100'}
        `}>
          {achievement.unlocked ? (
            <Trophy size={24} />
          ) : (
            <Lock size={24} />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {achievement.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {achievement.description}
          </p>
          
          <div className="flex items-center gap-2 mt-2">
            <span className={`
              px-2 py-0.5 rounded-full text-xs font-medium
              ${styles.badge}
            `}>
              {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {achievement.points} points
            </span>
          </div>
        </div>
      </div>

      <AchievementProgress achievement={achievement} />
      <AchievementRequirements achievement={achievement} />

      {achievement.unlocked && (
        <div className="absolute top-2 right-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`w-6 h-6 rounded-full flex items-center justify-center ${styles.badge}`}
          >
            ✓
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}