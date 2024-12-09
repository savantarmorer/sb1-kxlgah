import { Achievement } from '../types/achievements';
import { useNotificationSystem } from './notificationSystem';

type AchievementCallback = (achievement: Achievement) => void;
const subscribers: AchievementCallback[] = [];

export function subscribeToAchievements(callback: AchievementCallback) {
  subscribers.push(callback);
  return () => {
    const index = subscribers.indexOf(callback);
    if (index > -1) {
      subscribers.splice(index, 1);
    }
  };
}

export function notifyAchievementUnlock(achievement: Achievement) {
  const notificationSystem = useNotificationSystem();
  
  notificationSystem.showAchievement(achievement);

  // If achievement has share reward, show additional notification
  if (achievement.share_reward) {
    notificationSystem.showSuccess(`Share this achievement to earn bonus rewards!`);
  }

  // If achievement is secret, show special notification
  if (achievement.secret) {
    notificationSystem.showSuccess(`You've discovered a secret achievement!`);
  }
}

/**
 * Dependencies:
 * - NotificationSystem
 * - Achievement type
 * 
 * Used by:
 * - GameContext
 * - AchievementSystem
 * 
 * Features:
 * - Achievement unlock notifications
 * - Special notifications for secret achievements
 * - Share reward prompts
 * 
 * Scalability:
 * - Easy to add new notification types
 * - Support for different achievement types
 * - Extensible notification content
 */ 

