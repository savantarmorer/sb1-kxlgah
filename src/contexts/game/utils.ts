import type { GameState, Achievement, Quest, QuestRequirement } from './types';

/**
 * Evaluates if a condition is met based on the comparison type and value
 */
export const evaluateCondition = (
  currentValue: number,
  condition: { comparison: string; value: number }
): boolean => {
  switch (condition.comparison) {
    case 'eq': return currentValue === condition.value;
    case 'gt': return currentValue > condition.value;
    case 'lt': return currentValue < condition.value;
    case 'gte': return currentValue >= condition.value;
    case 'lte': return currentValue <= condition.value;
    default: return false;
  }
};

/**
 * Checks if an achievement's conditions are met
 */
export const checkAchievementConditions = (
  achievement: Achievement,
  state: GameState
): boolean => {
  return achievement.trigger_conditions.every(condition => {
    const currentValue = (state.user.battle_stats || {})[condition.type as keyof typeof state.user.battle_stats] || 0;
    return evaluateCondition(Number(currentValue), condition);
  });
};

/**
 * Calculates the current level based on XP
 */
export const calculateLevel = (xp: number): number => {
  // Example level calculation: each level requires previous level * 1000 XP
  let level = 1;
  let xpRequired = 1000;
  
  while (xp >= xpRequired) {
    level++;
    xp -= xpRequired;
    xpRequired = level * 1000;
  }
  
  return level;
};

/**
 * Calculates XP required for next level
 */
export const calculateXPForNextLevel = (current_level: number): number => {
  return current_level * 1000;
};

/**
 * Updates streak and calculates streak multiplier
 */
export const updateStreakMultiplier = (
  current_streak: number,
  lastActive: string
): { streak: number; multiplier: number } => {
  const now = new Date();
  const lastActiveDate = new Date(lastActive);
  const daysSinceLastActive = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLastActive > 1) {
    return { streak: 0, multiplier: 1 };
  }

  const newStreak = daysSinceLastActive === 1 ? current_streak + 1 : current_streak;
  const multiplier = Math.min(1 + (newStreak * 0.1), 2); // Cap at 2x

  return { streak: newStreak, multiplier };
};

/**
 * Evaluates quest progress and determines completion
 */
export const evaluateQuestProgress = (
  quest: Quest,
  requirement: QuestRequirement,
  progress: number
): { 
  completed: boolean;
  progress: number;
  rewards?: {
    xp: number;
    coins: number;
    items?: any[];
  }
} => {
  const currentProgress = Math.min(progress, requirement.target);
  const completed = currentProgress >= requirement.target;

  return {
    completed,
    progress: currentProgress,
    rewards: completed ? calculateRewards(quest, completed) : undefined
  };
};

/**
 * Formats a number with proper suffixes (K, M, B)
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Calculates score for a question based on time spent
 */
export const calculateQuestionScore = (timeSpent: number): number => {
  const baseScore = 100;
  const maxTime = 60; // Maximum time in seconds
  const minScore = 10; // Minimum score possible
  
  if (timeSpent >= maxTime) return minScore;
  
  const timeMultiplier = 1 - (timeSpent / maxTime);
  return Math.max(minScore, Math.round(baseScore * timeMultiplier));
};

/**
 * Calculates time bonus based on answer speed
 */
export const calculateTimeBonus = (
  answers: boolean[],
  timePerQuestion: number
): number => {
  const correctAnswers = answers.filter(a => a).length;
  const totalQuestions = answers.length;
  const averageTime = timePerQuestion * totalQuestions;
  
  // Base bonus calculation
  const baseBonus = Math.round((correctAnswers / totalQuestions) * 100);
  
  // Time multiplier (faster = better bonus)
  const timeMultiplier = Math.max(0.5, 2 - (timePerQuestion / 30));
  
  return Math.round(baseBonus * timeMultiplier);
};

/**
 * Processes and normalizes subject scores data
 */
export const processSubjectScores = (scoresData: any[] | null) => {
  if (!scoresData) return {};
  
  return scoresData.reduce((acc, score) => ({
    ...acc,
    [score.subject]: Math.round(score.value * 100) / 100
  }), {});
};

const calculateRewards = (quest: Quest, completed: boolean) => {
  if (!completed) return undefined;
  
  return {
    xp: quest.rewards.reduce((sum: number, r) => 
      r.type === 'xp' ? sum + Number(r.value) : sum, 0),
    coins: quest.rewards.reduce((sum: number, r) => 
      r.type === 'coins' ? sum + Number(r.value) : sum, 0),
    items: quest.rewards
      .filter((r): r is typeof r & { type: 'item' } => r.type === 'item')
      .map(r => r.metadata?.item)
  };
};
