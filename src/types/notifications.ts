import { Achievement } from './achievements';
import { Quest } from './quests';
import { Reward } from './rewards';

export type NotificationType = 'achievement' | 'quest' | 'reward' | 'error' | 'success';

export interface NotificationPayload {
  type: NotificationType;
  message: Achievement | Quest | Reward | string;
} 