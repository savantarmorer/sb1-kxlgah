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
  private handlers: NotificationHandlers;

  private constructor() {
    // Initialize with default handlers that warn about uninitialized state
    this.handlers = {
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
  }

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

  private checkInitialized(operation: string) {
    if (!this.initialized) {
      console.warn(`NotificationSystem not initialized for operation: ${operation}`);
      return false;
    }
    return true;
  }

  static showSuccess(message: string) {
    const instance = NotificationSystem.getInstance();
    if (!instance.checkInitialized('showSuccess')) return;
    instance.handlers.success(message);
  }

  static showError(message: string) {
    const instance = NotificationSystem.getInstance();
    if (!instance.checkInitialized('showError')) return;
    instance.handlers.error(message);
  }

  static showWarning(message: string) {
    const instance = NotificationSystem.getInstance();
    if (!instance.checkInitialized('showWarning')) return;
    instance.handlers.warning(message);
  }

  static showInfo(message: string) {
    const instance = NotificationSystem.getInstance();
    if (!instance.checkInitialized('showInfo')) return;
    instance.handlers.info(message);
  }

  static notifyAchievementUnlock(achievement: Achievement) {
    const instance = NotificationSystem.getInstance();
    if (!instance.checkInitialized('notifyAchievementUnlock')) return;
    instance.handlers.achievementUnlock(achievement);
  }
}

