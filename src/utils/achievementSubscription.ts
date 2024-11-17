import { Achievement } from '../types/achievements';

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
  subscribers.forEach(callback => callback(achievement));
} 