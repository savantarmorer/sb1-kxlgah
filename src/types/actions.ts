import { Quest, GameItem, User } from './index';
import { Achievement } from './achievements';

export type GameAction =
  | { type: 'ADD_XP'; payload: { amount: number; reason: string } }
  | { type: 'ADD_COINS'; payload: number }
  | { type: 'INCREMENT_STREAK' }
  | { type: 'RESET_STREAK' }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: Achievement }
  | { type: 'CLAIM_REWARD'; payload: { type: string; value: number; rarity: string } }
  | { type: 'COMPLETE_QUEST'; payload: string }
  | { type: 'ADD_QUEST'; payload: Quest }
  | { type: 'UPDATE_QUEST'; payload: Quest }
  | { type: 'REMOVE_QUEST'; payload: { id: string } }
  | { type: 'ADD_ITEM'; payload: GameItem }
  | { type: 'UPDATE_ITEM'; payload: GameItem }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<User> }
  | { type: 'PURCHASE_ITEM'; payload: { itemId: string; cost: number } }
  | { type: 'RECORD_LOGIN'; payload: string }
  | { type: 'SET_LAST_LOGIN'; payload: string }
  | { type: 'DISMISS_LEVEL_UP_REWARD' }
  | { type: 'SYNC_START' }
  | { type: 'SYNC_SUCCESS'; payload: { user: Partial<User> } }
  | { type: 'SYNC_ERROR' }
  | { type: 'SYNC_QUEST_PROGRESS'; payload: { questId: string; progress: number } }
  | { type: 'UPDATE_REWARD_MULTIPLIERS'; payload: { xp: number; coins: number } }
  | { type: 'UPDATE_STREAK_MULTIPLIER' }
  | { type: 'INITIALIZE_QUESTS'; payload: Quest[] }
  | { type: 'ADD_TO_INVENTORY'; payload: { item: any } }
  | { type: 'REMOVE_FROM_INVENTORY'; payload: { itemId: string } }
  | { type: 'EQUIP_ITEM'; payload: { itemId: string } }
  | { type: 'UNEQUIP_ITEM'; payload: { itemId: string } }
  | { type: 'UPDATE_ACHIEVEMENT_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'NOTIFY_ACHIEVEMENT'; payload: Achievement }
  | { type: 'SET_USER_ROLE'; payload: string[] }
  | { type: 'LEVEL_UP'; payload: { newLevel: number; rewards: any[] } }
  | { type: 'SYNC_ITEMS'; payload: GameItem[] }
  | { type: 'SYNC_STATISTICS'; payload: {
      activeUsers: number;
      completedQuests: number;
      purchasedItems: number;
      lastUpdated: string;
    }};