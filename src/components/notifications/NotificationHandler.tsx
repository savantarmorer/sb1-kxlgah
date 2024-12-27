import { useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationSystem } from '../../utils/notifications';

export default function NotificationHandler() {
  const notification = useNotification();

  useEffect(() => {
    NotificationSystem.getInstance().setHandlers({
      success: notification.showSuccess,
      error: notification.showError,
      warning: notification.showWarning,
      info: notification.showInfo,
      achievementUnlock: notification.notifyAchievementUnlock
    });
  }, [notification]);

  return null;
} 