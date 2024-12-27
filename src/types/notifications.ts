import { ReactNode } from 'react';
import { Achievement } from './achievements';
import { Quest } from './quests';
import { Reward } from './rewards';

export type NotificationType = 
  | 'success' 
  | 'error' 
  | 'admin' 
  | 'achievement' 
  | 'battle'
  | 'debug'
  | 'quest'
  | 'reward'
  | 'LEVEL_UP'
  | 'streak'
  | 'info' 
  | 'warning'
  | 'match'
  | 'tournament';

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string | ReactNode | Achievement | Quest | Reward | NotificationMessage;
  duration: number;
  data?: unknown;
  variant?: 'default' | 'persistent' | 'interactive';
  actions?: NotificationAction[];
  icon?: ReactNode;
  color?: string;
}

export interface NotificationState {
  queue: NotificationItem[];
  current: NotificationItem | null;
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  data?: Record<string, any>;
}

export interface NotificationMessage {
  title: string;
  description: string;
  questId?: string;
  rewardsList?: Reward[];
}

