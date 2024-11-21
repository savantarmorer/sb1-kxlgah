import { Quest } from '../types/quests';

export function formatQuestForDB(quest: Partial<Quest>) {
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
    is_active: quest.isActive !== false
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
    xpReward: data.xp_reward,
    coinReward: data.coin_reward,
    requirements: data.requirements || [],
    progress: data.progress || 0,
    isActive: data.is_active
  };
} 

