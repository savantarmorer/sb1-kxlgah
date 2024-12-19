import React from 'react';
import { toast, ToastOptions } from 'react-hot-toast';
import { Trophy, Scroll, Gift, Star } from 'lucide-react';
import { Achievement } from '../types/achievements';
import { Quest } from '../types/quests';
import { Reward, RewardRarity } from '../types/rewards';
import Button from '../components/Button';

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
   * Shows level up notification with lootbox option
   * @param options - Level up notification options
   */
  showLevelUp: (options: {
    level: number;
    rewards: Reward[];
    lootbox_id: string;
    onOpen: () => void;
    onSave: () => void;
  }) => {
    const highestRarity = options.rewards.reduce<RewardRarity>((highest, reward) => {
      const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 } as const;
      if (!reward.rarity) return highest;
      return rarityOrder[reward.rarity] > rarityOrder[highest] ? reward.rarity : highest;
    }, 'common');

    const getRarityColor = (rarity: RewardRarity) => {
      switch (rarity) {
        case 'legendary': return 'text-yellow-500';
        case 'epic': return 'text-purple-500';
        case 'rare': return 'text-blue-500';
        default: return 'text-gray-500';
      }
    };

    toast.custom(
      (t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 max-w-md w-full mx-4`}>
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <Trophy className={`w-16 h-16 ${getRarityColor(highestRarity)}`} />
              <div className="absolute -top-2 -right-2">
                <Star className={`w-6 h-6 ${getRarityColor(highestRarity)}`} />
              </div>
            </div>
            <h2 className="text-2xl font-bold mt-4 dark:text-white">Level Up!</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
              You've reached Level {options.level}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {options.rewards.map((reward, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  reward.rarity === 'legendary' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                  reward.rarity === 'epic' ? 'bg-purple-100 dark:bg-purple-900/30' :
                  reward.rarity === 'rare' ? 'bg-blue-100 dark:bg-blue-900/30' :
                  'bg-gray-100 dark:bg-gray-900/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Gift className={reward.rarity ? getRarityColor(reward.rarity) : 'text-gray-500'} />
                    <span className="font-medium dark:text-white">
                      {reward.type === 'xp' && `+${reward.value} XP`}
                      {reward.type === 'coins' && `+${reward.value} Coins`}
                      {reward.type === 'item' && reward.value}
                    </span>
                  </div>
                  <Star className={reward.rarity ? getRarityColor(reward.rarity) : 'text-gray-500'} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <Button
              variant="primary"
              onClick={() => {
                options.onOpen();
                toast.dismiss(t.id);
              }}
              className="flex-1"
            >
              Open Now
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                options.onSave();
                toast.dismiss(t.id);
              }}
              className="flex-1"
            >
              Save for Later
            </Button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: 'top-center',
      }
    );
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
              <span className="text-sm text-yellow-600">+{quest.xp_reward} XP</span>
              <span className="text-sm text-yellow-600">+{quest.coin_reward} Coins</span>
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

