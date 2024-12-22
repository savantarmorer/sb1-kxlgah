import { Item, ItemType, ItemRarity, ItemEffect } from '../types/items';

export const SAMPLE_ITEMS: Item[] = [
  {
    id: 'xp-boost-1',
    name: 'Minor XP Boost',
    description: 'Increases XP gain by 50% for 30 minutes',
    type: ItemType.BOOSTER,
    rarity: ItemRarity.COMMON,
    basePrice: 100,
    effects: [
      {
        type: 'xp_boost',
        value: 1.5,
        duration: 1800 // 30 minutes in seconds
      }
    ]
  },
  {
    id: 'coin-boost-1',
    name: 'Minor Coin Boost',
    description: 'Increases coin gain by 50% for 30 minutes',
    type: ItemType.BOOSTER,
    rarity: ItemRarity.COMMON,
    basePrice: 100,
    effects: [
      {
        type: 'coin_boost',
        value: 1.5,
        duration: 1800
      }
    ]
  },
  {
    id: 'time-boost-1',
    name: 'Minor Time Extension',
    description: 'Adds 30 seconds to battle time limit',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    basePrice: 50,
    effects: [
      {
        type: 'time_boost',
        value: 30
      }
    ]
  },
  {
    id: 'score-boost-1',
    name: 'Minor Score Boost',
    description: 'Increases battle score by 20% for one battle',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.UNCOMMON,
    basePrice: 150,
    effects: [
      {
        type: 'score_boost',
        value: 1.2
      }
    ]
  },
  {
    id: 'golden-gavel',
    name: 'Golden Gavel',
    description: 'A prestigious symbol of legal mastery',
    type: ItemType.COSMETIC,
    rarity: ItemRarity.LEGENDARY,
    basePrice: 10000,
    effects: []
  },
  {
    id: 'study-guide-1',
    name: 'Basic Study Guide',
    description: 'Increases XP gain from study sessions by 25%',
    type: ItemType.EQUIPMENT,
    rarity: ItemRarity.UNCOMMON,
    basePrice: 500,
    effects: [
      {
        type: 'xp_boost',
        value: 1.25
      }
    ]
  },
  {
    id: 'mega-boost-1',
    name: 'Mega Boost Bundle',
    description: 'Increases all gains by 100% for 1 hour',
    type: ItemType.BOOSTER,
    rarity: ItemRarity.EPIC,
    basePrice: 1000,
    effects: [
      {
        type: 'xp_boost',
        value: 2,
        duration: 3600
      },
      {
        type: 'coin_boost',
        value: 2,
        duration: 3600
      },
      {
        type: 'score_boost',
        value: 2,
        duration: 3600
      }
    ]
  },
  {
    id: 'elimination-potion',
    name: 'Elimination Potion',
    description: 'Eliminates a wrong answer from the options',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.UNCOMMON,
    basePrice: 150,
    imageUrl: '/images/items/potion-purple.png',
    effects: [
      {
        type: 'eliminate_wrong_answer',
        value: 1,
        metadata: {
          battle_only: true
        }
      }
    ]
  }
];

export const getItemById = (id: string): Item | undefined => {
  return SAMPLE_ITEMS.find(item => item.id === id);
};

export const getItemsByType = (type: ItemType): Item[] => {
  return SAMPLE_ITEMS.filter(item => item.type === type);
};

export const getItemsByRarity = (rarity: ItemRarity): Item[] => {
  return SAMPLE_ITEMS.filter(item => item.rarity === rarity);
};

export const getItemsByEffect = (effectType: string): Item[] => {
  return SAMPLE_ITEMS.filter(item => 
    item.effects?.some((effect: ItemEffect) => effect.type === effectType)
  );
};
