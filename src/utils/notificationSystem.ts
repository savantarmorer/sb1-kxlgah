import { useCallback } from 'react';
import { Achievement } from '../types/achievements';
import { Quest } from '../types/quests';
import { Reward } from '../types/rewards';
import { useNotification } from '../contexts/NotificationContext';

export function useNotificationSystem() {
  const { showNotification } = useNotification();

  const showAchievement = useCallback((achievement: Achievement) => {
    showNotification({
      type: 'achievement',
      message: achievement,
      duration: 4000,
      variant: 'default'
    });
  }, [showNotification]);

  const showQuestComplete = useCallback((quest: Quest) => {
    showNotification({
      type: 'quest',
      message: quest,
      duration: 4000,
      variant: 'default'
    });
  }, [showNotification]);

  const showReward = useCallback((reward: Reward) => {
    showNotification({
      type: 'reward',
      message: reward,
      duration: 3000,
      variant: 'default'
    });
  }, [showNotification]);

  const showError = useCallback((message: string) => {
    showNotification({
      type: 'error',
      message,
      duration: 5000,
      variant: 'default'
    });
  }, [showNotification]);

  const showSuccess = useCallback((message: string) => {
    showNotification({
      type: 'success',
      message,
      duration: 3000,
      variant: 'default'
    });
  }, [showNotification]);

  return {
    showAchievement,
    showQuestComplete,
    showReward,
    showError,
    showSuccess
  };
}

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
 * 
 * Scalability:
 * - Easy to add new notification types
 * - Centralized notification management
 * - Customizable durations and variants
 */ 

