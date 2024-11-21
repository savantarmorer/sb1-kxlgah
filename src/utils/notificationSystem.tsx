import React from 'react';
import { toast, ToastOptions } from 'react-hot-toast';
import { Trophy, Scroll, Gift } from 'lucide-react';
import { Achievement } from '../types/achievements';
import { Quest } from '../types/quests';
import { Reward } from '../types/rewards';

/**
 * Centralized notification system for the application
 * Handles different types of notifications with consistent styling
 */
export const NotificationSystem = {
  /**
   * Shows achievement unlock notification
   * @param achievement - Achievement that was unlocked
   */
  showAchievement: (achievement: Achievement) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 flex items-center space-x-4`}>
        <div className="flex-shrink-0">
          <Trophy className="text-yellow-500" size={24} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">{achievement.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
        </div>
      </div>
    ), { duration: 4000 });
  },

  /**
   * Shows quest completion notification
   * @param quest - Completed quest
   */
  showQuestComplete: (quest: Quest) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4`}>
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <Scroll className="text-green-500" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Quest Complete!</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{quest.title}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-sm text-yellow-600">+{quest.xpReward} XP</span>
              <span className="text-sm text-yellow-600">+{quest.coinReward} Coins</span>
            </div>
          </div>
        </div>
      </div>
    ), { duration: 4000 });
  },

  /**
   * Shows reward notification
   * @param reward - Reward that was received
   */
  showReward: (reward: Reward) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4`}>
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <Gift className="text-indigo-500" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Reward Received!</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {typeof reward.value === 'number' 
                ? `+${reward.value} ${reward.type}`
                : reward.value}
            </p>
          </div>
        </div>
      </div>
    ), { duration: 3000 });
  },

  /**
   * Shows error notification
   * @param message - Error message to display
   */
  showError: (message: string) => {
    toast.error(message, {
      duration: 4000,
      className: 'dark:bg-gray-800 dark:text-white'
    });
  },

  /**
   * Shows success notification
   * @param message - Success message to display
   */
  showSuccess: (message: string) => {
    toast.success(message, {
      duration: 3000,
      className: 'dark:bg-gray-800 dark:text-white'
    });
  }
};

/**
 * Dependencies:
 * - react-hot-toast for toast notifications
 * - lucide-react for icons
 * - Achievement, Quest, Reward types
 * 
 * Used by:
 * - Achievement system
 * - Quest system
 * - Battle system
 * - Reward system
 * 
 * Features:
 * - Consistent styling
 * - Dark mode support
 * - Custom animations
 * - Type-safe notifications
 * 
 * Scalability:
 * - Easy to add new notification types
 * - Centralized configuration
 * - Reusable components
 * - Customizable durations
 */ 

