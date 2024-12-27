import { Quest } from '../types/quests';

export function formatQuestForDB(quest: Partial<Quest>) {
  return {
    title: quest.title,
    description: quest.description,
    type: quest.type || 'daily',
    status: quest.status || 'available',
    category: quest.category || 'general',
    xp_reward: quest.xp_reward || 0,
    coin_reward: quest.coin_reward || 0,
    requirements: quest.requirements || [],
    progress: quest.progress || 0,
    is_active: quest.is_active !== false
  };
}

export function formatQuestFromDB(data: any): Quest {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    type: data.type,
    status: data.status,
    category: data.category,
    xp_reward: data.xp_reward,
    coin_reward: data.coin_reward,
    requirements: data.requirements || [],
    progress: data.progress || 0,
    is_active: data.is_active
  };
} 

