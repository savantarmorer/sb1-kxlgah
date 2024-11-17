import { Quest, QuestRequirement } from '../types/quests';
import type { Json } from '../types/supabase';

export function formatQuestForDB(quest: Partial<Quest>): Record<string, any> {
  const requirements = quest.requirements?.map(req => ({
    id: req.id,
    description: req.description,
    type: req.type,
    value: req.value,
    completed: req.completed
  })) as unknown as Json[];

  return {
    ...quest,
    deadline: quest.deadline?.toISOString(),
    xp_reward: quest.xpReward,
    coin_reward: quest.coinReward,
    requirements,
    lootbox: quest.lootbox ? {
      rarity: quest.lootbox.rarity,
      contents: quest.lootbox.contents
    } as Json : null
  };
}

export function formatQuestFromDB(dbQuest: any): Quest {
  return {
    ...dbQuest,
    deadline: new Date(dbQuest.deadline),
    xpReward: dbQuest.xp_reward,
    coinReward: dbQuest.coin_reward,
    requirements: dbQuest.requirements || [],
    lootbox: dbQuest.lootbox || undefined
  };
} 