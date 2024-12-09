import { Achievement, AchievementTrigger } from '../types/achievements';

/**
 * Check if an achievement has been completed based on its trigger conditions
 * @param achievement Achievement to check
 * @returns boolean indicating if achievement is completed
 */
export const isAchievementCompleted = (achievement: Achievement): boolean => {
  const { trigger } = achievement;
  
  if (!trigger || !trigger.type || typeof trigger.value !== 'number') {
    console.error('Invalid achievement trigger:', trigger);
    return false;
  }

  // Implement achievement completion logic based on trigger type
  switch (trigger.type) {
    case 'BATTLES_WON':
    case 'QUESTIONS_ANSWERED':
    case 'QUESTS_COMPLETED':
    case 'ACHIEVEMENTS_UNLOCKED':
    case 'ITEMS_COLLECTED':
    case 'COINS_EARNED':
    case 'XP_GAINED':
    case 'HIGHEST_STREAK':
      return trigger.current >= trigger.value;
    default:
      console.warn(`Unknown achievement trigger type: ${trigger.type}`);
      return false;
  }
};
