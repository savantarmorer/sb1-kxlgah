import { Quest, QuestType, QuestStatus } from '../types/quests';
import { SAMPLE_ITEMS } from './items';

export const SAMPLE_QUESTS: Quest[] = [
  {
    id: 'quest-battle-1',
    title: 'Battle Novice',
    description: 'Win your first 3 battles to prove your worth',
    type: QuestType.BATTLE,
    status: QuestStatus.AVAILABLE,
    category: 'battle',
    xp_reward: 500,
    coin_reward: 1000,
    requirements: [
      {
        type: QuestType.BATTLE,
        amount: 0,
        target: 3,
        current: 0,
        description: 'Win battles'
      }
    ],
    progress: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'quest-study-1',
    title: 'Dedicated Scholar',
    description: 'Study for a total of 2 hours',
    type: QuestType.STUDY,
    status: QuestStatus.AVAILABLE,
    category: 'study',
    xp_reward: 1000,
    coin_reward: 500,
    requirements: [
      {
        type: QuestType.STUDY,
        target: 7200, // 2 hours in seconds
        description: 'Study time',
        progress: 0,
        current: 0,
        amount: 7200
      }
    ],
    progress: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'quest-achievement-1',
    title: 'Achievement Hunter',
    description: 'Unlock 5 achievements',
    type: QuestType.ACHIEVEMENT,
    status: QuestStatus.AVAILABLE,
    category: 'achievement',
    xp_reward: 2000,
    coin_reward: 2000,
    requirements: [
      {
        type: QuestType.ACHIEVEMENT,
        target: 5,
        description: 'Unlock achievements',
        progress: 0,
        current: 0,
        amount: 5
      }
    ],
    progress: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'quest-streak-1',
    title: 'Consistency is Key',
    description: 'Maintain a 7-day study streak',
    type: QuestType.STREAK,
    status: QuestStatus.AVAILABLE,
    category: 'streak',
    xp_reward: 1500,
    coin_reward: 1500,
    requirements: [
      {
        type: QuestType.STREAK,
        target: 7,
        description: 'Maintain streak',
        progress: 0,
        current: 0,
        amount: 7
      }
    ],
    progress: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'quest-collection-1',
    title: 'Item Collector',
    description: 'Collect 5 different items',
    type: QuestType.COLLECTION,
    status: QuestStatus.AVAILABLE,
    category: 'collection',
    xp_reward: 1000,
    coin_reward: 1000,
    requirements: [
      {
        type: QuestType.COLLECTION,
        target: 5,
        description: 'Collect items',
        progress: 0,
        current: 0,
        amount: 5
      }
    ],
    progress: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'quest-social-1',
    title: 'Social Butterfly',
    description: 'Complete 3 battles with different opponents',
    type: QuestType.SOCIAL,
    status: QuestStatus.AVAILABLE,
    category: 'social',
    xp_reward: 800,
    coin_reward: 800,
    requirements: [
      {
        type: QuestType.SOCIAL,
        target: 3,
        description: 'Complete social actions',
        progress: 0,
        current: 0,
        amount: 3
      }
    ],
    progress: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const getQuestById = (id: string): Quest | undefined => {
  return SAMPLE_QUESTS.find(quest => quest.id === id);
};

export const getQuestsByType = (type: QuestType): Quest[] => {
  return SAMPLE_QUESTS.filter(quest => quest.type === type);
};

export const getQuestsByStatus = (status: QuestStatus): Quest[] => {
  return SAMPLE_QUESTS.filter(quest => quest.status === status);
};

export const getAvailableQuests = (): Quest[] => {
  return SAMPLE_QUESTS.filter(quest => quest.status === QuestStatus.AVAILABLE);
};

export const getActiveQuests = (): Quest[] => {
  return SAMPLE_QUESTS.filter(quest => quest.status === QuestStatus.IN_PROGRESS);
};

export const getCompletedQuests = (): Quest[] => {
  return SAMPLE_QUESTS.filter(quest => quest.status === QuestStatus.COMPLETED);
};
