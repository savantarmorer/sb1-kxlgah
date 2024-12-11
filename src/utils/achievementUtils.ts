import { Achievement, AchievementTrigger } from '../types/achievements';

/**
 * Check if an achievement has been completed based on its trigger conditions
 * @param achievement Achievement to check
 * @returns boolean indicating if achievement is completed
 */
export const isAchievementCompleted = (achievement: Achievement): boolean => {
  const { trigger_conditions } = achievement;
  
  if (!trigger_conditions?.length) {
    console.error('Invalid achievement trigger conditions:', trigger_conditions);
    return false;
  }

  // Check if all trigger conditions are met
  return trigger_conditions.every(condition => {
    // Implementation of condition checking logic
    // You'll need to implement this based on your specific needs
    return true; // placeholder
  });
};
