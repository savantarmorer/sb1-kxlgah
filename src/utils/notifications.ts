import { Achievement } from '../types/achievements';
import { useNotification } from '../contexts/NotificationContext';

let notificationHandler: ReturnType<typeof useNotification> | null = null;

export function NotificationHandler() {
  notificationHandler = useNotification();
  return null;
}

export const NotificationSystem = {
  showSuccess: (message: string) => {
    if (!notificationHandler) {
      console.warn('NotificationHandler not initialized');
      return;
    }
    notificationHandler.showSuccess(message);
  },

  showError: (message: string) => {
    if (!notificationHandler) {
      console.warn('NotificationHandler not initialized');
      return;
    }
    notificationHandler.showError(message);
  },

  showWarning: (message: string) => {
    if (!notificationHandler) {
      console.warn('NotificationHandler not initialized');
      return;
    }
    notificationHandler.showWarning(message);
  },

  showInfo: (message: string) => {
    if (!notificationHandler) {
      console.warn('NotificationHandler not initialized');
      return;
    }
    notificationHandler.showInfo(message);
  },
};

export const notifyAchievementUnlock = (achievement: Achievement) => {
  if (!notificationHandler) {
    console.warn('NotificationHandler not initialized');
    return;
  }
  notificationHandler.showSuccess(`Achievement unlocked: ${achievement.title}`);
};

