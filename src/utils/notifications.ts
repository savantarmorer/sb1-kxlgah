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
  private initialized = false;
  private handlers: NotificationHandlers = {
    success: (message: string) => {
      console.warn('NotificationSystem not initialized:', message);
    },
    error: (message: string) => {
      console.warn('NotificationSystem not initialized:', message);
    },
    warning: (message: string) => {
      console.warn('NotificationSystem not initialized:', message);
    },
    info: (message: string) => {
      console.warn('NotificationSystem not initialized:', message);
    },
    achievementUnlock: (achievement: Achievement) => {
      console.warn('NotificationSystem not initialized:', achievement);
    }
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
    this.initialized = true;
  }

  static showSuccess(message: string) {
    const instance = NotificationSystem.getInstance();
    if (!instance.initialized) {
      console.warn('NotificationSystem not initialized:', message);
      return;
    }
    instance.handlers.success(message);
  }

  static showError(message: string) {
    const instance = NotificationSystem.getInstance();
    if (!instance.initialized) {
      console.warn('NotificationSystem not initialized:', message);
      return;
    }
    instance.handlers.error(message);
  }

  static showWarning(message: string) {
    const instance = NotificationSystem.getInstance();
    if (!instance.initialized) {
      console.warn('NotificationSystem not initialized:', message);
      return;
    }
    instance.handlers.warning(message);
  }

  static showInfo(message: string) {
    const instance = NotificationSystem.getInstance();
    if (!instance.initialized) {
      console.warn('NotificationSystem not initialized:', message);
      return;
    }
    instance.handlers.info(message);
  }

  static notifyAchievementUnlock(achievement: Achievement) {
    const instance = NotificationSystem.getInstance();
    if (!instance.initialized) {
      console.warn('NotificationSystem not initialized:', achievement);
      return;
    }
    instance.handlers.achievementUnlock(achievement);
  }
}

