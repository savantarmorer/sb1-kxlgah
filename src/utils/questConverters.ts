import { Quest } from '../types/quests';

/**
 * Converts a Quest object to database format
 */
export function convertQuestToDB(quest: Partial<Quest>) {
  const now = new Date().toISOString();
  
  return {
    title: quest.title,
    description: quest.description,
    type: quest.type || 'daily',
    status: quest.status || 'available',
    category: quest.category || 'general',
    xp_reward: quest.xpReward || 0,
    coin_reward: quest.coinReward || 0,
    requirements: quest.requirements || [],
    progress: quest.progress || 0,
    is_active: true,
    created_at: now,
    updated_at: now
  };
}

/**
 * Converts a database quest to frontend format
 */
export function convertQuestFromDB(dbQuest: any): Quest {
  return {
    id: dbQuest.id,
    title: dbQuest.title,
    description: dbQuest.description,
    type: dbQuest.type,
    status: dbQuest.status,
    category: dbQuest.category,
    xpReward: dbQuest.xp_reward,
    coinReward: dbQuest.coin_reward,
    requirements: dbQuest.requirements || [],
    progress: dbQuest.progress || 0,
    isActive: dbQuest.is_active
  };
} 

