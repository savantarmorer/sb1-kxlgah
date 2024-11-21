import { Achievement } from '../types/achievements';
import { Quest } from '../types/quests';
import { Reward } from '../types/rewards';
import { NotificationItem } from '../types/notifications';

export function isAchievement(value: any): value is Achievement {
  return value && 'title' in value && 'description' in value && 'points' in value;
}

export function isQuest(value: any): value is Quest {
  return value && 'title' in value && 'xpReward' in value && 'coinReward' in value;
}

export function isReward(value: any): value is Reward {
  return value && 'type' in value && 'value' in value && 'rarity' in value;
}

export function isNotificationItem(value: any): value is NotificationItem {
  return value && 'type' in value && 'message' in value && 'duration' in value;
} 

