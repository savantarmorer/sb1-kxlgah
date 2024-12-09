import { Quest, QuestType, QuestStatus } from '../types/quests';
import { SAMPLE_ITEMS } from './items';

export const SAMPLE_QUESTS: Quest[] = [
  {
    id: 'quest-battle-1',
    title: 'Battle Novice',
    description: 'Win your first 3 battles to prove your worth',
    type: QuestType.BATTLE,
    status: QuestStatus.AVAILABLE,
    progress: 0,
    category: 'battle',
    is_active: true,
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
    rewards: [
      {
        id: `quest_xp_${'quest-battle-1'}`,
        type: 'xp',
        value: 1000,
        name: 'Quest XP',
        description: 'XP earned from quest',
        amount: 1,
        rarity: 'common'
      },
      {
        id: `quest_coins_${'quest-battle-1'}`,
        type: 'coins',
        value: 500,
        name: 'Quest Coins',
        description: 'Coins earned from quest',
        amount: 1,
        rarity: 'common'
      }
    ]
  },
  {
    id: 'quest-study-1',
    title: 'Dedicated Scholar',
    description: 'Study for a total of 2 hours',
    type: QuestType.STUDY,
    status: QuestStatus.AVAILABLE,
    progress: 0,
    category: 'study',
    is_active: true,
    xp_reward: 1000,
    coin_reward: 500,
    requirements: [
      {
        type: QuestType.STUDY,
        amount: 0,
        target: 7200, // 2 hours in seconds
        current: 0,
        description: 'Study time'
      }
    ],
    rewards: [
      {
        id: `quest_xp_quest-study-1`,
        type: 'xp',
        value: 1000,
        name: 'Quest XP',
        description: 'XP earned from quest',
        amount: 1,
        rarity: 'common'
      },
      {
        id: `quest_coins_quest-study-1`,
        type: 'coins',
        value: 500,
        name: 'Quest Coins',
        description: 'Coins earned from quest',
        amount: 1,
        rarity: 'common'
      }
    ]
  },
  {
    id: 'quest-achievement-1',
    title: 'Achievement Hunter',
    description: 'Unlock 5 achievements',
    type: QuestType.ACHIEVEMENT,
    status: QuestStatus.AVAILABLE,
    progress: 0,
    category: 'achievement',
    is_active: true,
    xp_reward: 2000,
    coin_reward: 2000,
    requirements: [
      {
        type: QuestType.ACHIEVEMENT,
        amount: 0,
        target: 5,
        current: 0,
        description: 'Unlock achievements'
      }
    ],
    rewards: [
      {
        id: `quest_xp_quest-achievement-1`,
        type: 'xp',
        value: 2000,
        name: 'Quest XP',
        description: 'XP earned from quest',
        amount: 1,
        rarity: 'common'
      },
      {
        id: `quest_coins_quest-achievement-1`,
        type: 'coins',
        value: 2000,
        name: 'Quest Coins',
        description: 'Coins earned from quest',
        amount: 1,
        rarity: 'common'
      }
    ]
  },
  {
    id: 'quest-streak-1',
    title: 'Consistency is Key',
    description: 'Maintain a 7-day study streak',
    type: QuestType.STREAK,
    status: QuestStatus.AVAILABLE,
    progress: 0,
    category: 'streak',
    is_active: true,
    xp_reward: 1500,
    coin_reward: 1500,
    requirements: [
      {
        type: QuestType.STREAK,
        amount: 0,
        target: 7,
        current: 0,
        description: 'Maintain streak'
      }
    ],
    rewards: [
      {
        id: `quest_xp_quest-streak-1`,
        type: 'xp',
        value: 1500,
        name: 'Quest XP',
        description: 'XP earned from quest',
        amount: 1,
        rarity: 'common'
      },
      {
        id: `quest_coins_quest-streak-1`,
        type: 'coins',
        value: 1500,
        name: 'Quest Coins',
        description: 'Coins earned from quest',
        amount: 1,
        rarity: 'common'
      }
    ]
  },
  {
    id: 'quest-collection-1',
    title: 'Item Collector',
    description: 'Collect 5 different items',
    type: QuestType.COLLECTION,
    status: QuestStatus.AVAILABLE,
    progress: 0,
    category: 'collection',
    is_active: true,
    xp_reward: 1000,
    coin_reward: 1000,
    requirements: [
      {
        type: QuestType.COLLECTION,
        amount: 0,
        target: 5,
        current: 0,
        description: 'Collect items'
      }
    ],
    rewards: [
      {
        id: `quest_xp_quest-collection-1`,
        type: 'xp',
        value: 1000,
        name: 'Quest XP',
        description: 'XP earned from quest',
        amount: 1,
        rarity: 'common'
      },
      {
        id: `quest_coins_quest-collection-1`,
        type: 'coins',
        value: 1000,
        name: 'Quest Coins',
        description: 'Coins earned from quest',
        amount: 1,
        rarity: 'common'
      }
    ]
  },
  {
    id: 'quest-social-1',
    title: 'Social Butterfly',
    description: 'Complete 3 battles with different opponents',
    type: QuestType.SOCIAL,
    status: QuestStatus.AVAILABLE,
    progress: 0,
    category: 'social',
    is_active: true,
    xp_reward: 800,
    coin_reward: 800,
    requirements: [
      {
        type: QuestType.SOCIAL,
        amount: 0,
        target: 3,
        current: 0,
        description: 'Complete social actions'
      }
    ],
    rewards: [
      {
        id: `quest_xp_quest-social-1`,
        type: 'xp',
        value: 800,
        name: 'Quest XP',
        description: 'XP earned from quest',
        amount: 1,
        rarity: 'common'
      },
      {
        id: `quest_coins_quest-social-1`,
        type: 'coins',
        value: 800,
        name: 'Quest Coins',
        description: 'Coins earned from quest',
        amount: 1,
        rarity: 'common'
      }
    ]
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
