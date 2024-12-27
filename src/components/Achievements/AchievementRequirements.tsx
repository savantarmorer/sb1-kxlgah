import React from 'react';
import { Achievement, TriggerCondition } from '../../types/achievements';
import { CheckCircle, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AchievementRequirementsProps {
  achievement: Achievement;
}

export function AchievementRequirements({ achievement }: AchievementRequirementsProps) {
  const formatCondition = (condition: TriggerCondition): string => {
    switch (condition.type) {
      case 'battle_wins':
        return `Win ${condition.value} battles`;
      case 'xp_gained':
        return `Gain ${condition.value} XP`;
      case 'battle_score':
        return `Score ${condition.value} points in battle`;
      case 'quests_completed':
        return `Complete ${condition.value} quests`;
      case 'login_days':
        return `Login for ${condition.value} days`;
      case 'battle_streak':
        return `Maintain a ${condition.value} battle win streak`;
      case 'battle_rating':
        return `Reach ${condition.value} battle rating`;
      default:
        return `Reach ${condition.value} ${condition.type.replace('_', ' ')}`;
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="mt-4">
      <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
        Requirements
      </h4>
      <motion.ul
        className="space-y-2"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {achievement.trigger_conditions && Array.isArray(achievement.trigger_conditions) && achievement.trigger_conditions.map((condition, index) => (
          <motion.li
            key={index}
            className="flex items-center gap-2"
            variants={item}
          >
            {achievement.unlocked ? (
              <CheckCircle className="text-green-500 dark:text-green-400" size={16} />
            ) : (
              <Circle className="text-gray-400 dark:text-gray-600" size={16} />
            )}
            <span className={`
              text-sm
              ${achievement.unlocked 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-gray-600 dark:text-gray-400'
              }
            `}>
              {formatCondition(condition)}
            </span>
          </motion.li>
        ))}
      </motion.ul>

      {achievement.prerequisites?.length > 0 && (
        <div className="mt-3">
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
            Prerequisites
          </h4>
          <ul className="space-y-1">
            {achievement.prerequisites.map((prereq, index) => (
              <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                • {prereq}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 