import { Achievement } from '../types/achievements';
import { Quest } from '../types/quests';
import { Reward } from '../types/rewards';
import { useNotification } from '../contexts/NotificationContext';

export const NotificationSystem = {
  showAchievement: (achievement: Achievement) => {
    const { showNotification } = useNotification();
    showNotification({
      type: 'achievement',
      message: achievement,
      duration: 4000,
      variant: 'default'
    });
  },

  showQuestComplete: (quest: Quest) => {
    const { showNotification } = useNotification();
    showNotification({
      type: 'quest',
      message: quest,
      duration: 4000,
      variant: 'default'
    });
  },

  showReward: (reward: Reward) => {
    const { showNotification } = useNotification();
    showNotification({
      type: 'reward',
      message: reward,
      duration: 3000,
      variant: 'default'
    });
  },

  showError: (message: string) => {
    const { showNotification } = useNotification();
    showNotification({
      type: 'error',
      message,
      duration: 5000,
      variant: 'default'
    });
  },

  showSuccess: (message: string) => {
    const { showNotification } = useNotification();
    showNotification({
      type: 'success',
      message,
      duration: 3000,
      variant: 'default'
    });
  }
};

/**
 * Dependencies:
 * - NotificationContext for state management
 * - Achievement, Quest, and Reward types
 * 
 * Used by:
 * - GameContext for game events
 * - AdminContext for admin actions
 * - Various components
 * 
 * Features:
 * - Type-safe notifications
 * - Consistent styling
 * - Duration control
 * - Variant support
 */ 

