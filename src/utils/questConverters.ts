import { Quest } from '../types/quests';

/**
 * Converts a Quest object to database format
 */
export function convertQuestToDB(quest: Partial<Quest>) {
  const now = new Date().toISOString();
  
  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    type: quest.type || 'daily',
    status: quest.status || 'available',
    category: quest.category || 'general',
    xp_reward: quest.xp_reward || 0,
    coin_reward: quest.coin_reward || 0,
    requirements: quest.requirements || [],
    progress: quest.progress || 0,
    is_active: quest.is_active !== false,
    completed: quest.completed || false,
    created_at: quest.created_at || now,
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
    xp_reward: dbQuest.xp_reward,
    coin_reward: dbQuest.coin_reward,
    requirements: dbQuest.requirements || [],
    progress: dbQuest.progress || 0,
    is_active: dbQuest.is_active !== false,
    completed: dbQuest.completed || false,
    created_at: dbQuest.created_at,
    updated_at: dbQuest.updated_at
  };
} 

