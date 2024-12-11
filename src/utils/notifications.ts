import { Achievement } from '../types/achievements';

interface NotificationHandlers {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  achievementUnlock: (achievement: Achievement) => void;
}

export class NotificationSystem {
  private static instance: NotificationSystem;
  private handlers: NotificationHandlers = {
    success: () => {},
    error: () => {},
    warning: () => {},
    info: () => {},
    achievementUnlock: () => {}
  };

  private constructor() {}

  static getInstance(): NotificationSystem {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem();
    }
    return NotificationSystem.instance;
  }

  setHandlers(handlers: Partial<NotificationHandlers>) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  static showSuccess(message: string) {
    NotificationSystem.getInstance().handlers.success(message);
  }

  static showError(message: string) {
    NotificationSystem.getInstance().handlers.error(message);
  }

  static showWarning(message: string) {
    NotificationSystem.getInstance().handlers.warning(message);
  }

  static showInfo(message: string) {
    NotificationSystem.getInstance().handlers.info(message);
  }

  static notifyAchievementUnlock(achievement: Achievement) {
    NotificationSystem.getInstance().handlers.achievementUnlock(achievement);
  }
}

