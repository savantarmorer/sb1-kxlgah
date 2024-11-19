import { Quest, QuestRequirement } from '../types/quests';
import { Achievement } from '../types/achievements';

export function checkQuestAchievements(quests: Quest[]): Achievement[] {
  const achievements: Achievement[] = [];
  const completedQuests = quests.filter(q => q.status === 'completed');

  // Check for quest completion milestones
  if (completedQuests.length >= 10) {
    achievements.push({
      id: 'quest_master',
      title: 'Quest Master',
      description: 'Complete 10 quests',
      category: 'quests',
      points: 50,
      rarity: 'rare',
      unlocked: true,
      unlockedAt: new Date(),
      prerequisites: [],
      dependents: [],
      triggerConditions: [{
        type: 'quest',
        value: 10,
        comparison: 'gte'
      }],
      order: 1
    });
  }

  // Add more quest-related achievements here

  return achievements;
}

export function checkQuestRequirements(quest: Quest, userState: any): boolean {
  if (!quest.requirements) return true;

  return quest.requirements.every(req => {
    switch (req.type) {
      case 'score':
        return userState[`${req.description.toLowerCase()}_score`] >= req.value;
      case 'time':
        return userState.studyTime >= req.value;
      case 'battles':
        return userState.battlesWon >= req.value;
      case 'streak':
        return userState.streak >= req.value;
      default:
        return false;
    }
  });
}

export function calculateQuestProgress(quest: Quest, userState: any): number {
  if (!quest.requirements || quest.requirements.length === 0) return 0;

  const progress = quest.requirements.map(req => {
    const current = userState[`${req.description.toLowerCase()}_score`] || 0;
    return Math.min((current / req.value) * 100, 100);
  });

  return Math.floor(progress.reduce((a, b) => a + b) / progress.length);
} 