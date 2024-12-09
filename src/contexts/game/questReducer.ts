import type { GameState, GameAction } from './types';
import type { Quest } from '../../types/quests';
import type { InventoryItem } from '../../types/items';

/**
 * Quest Reducer Handler
 * 
 * Manages quest-related state updates in the game context
 * 
 * Dependencies:
 * - GameState: Core state structure
 * - GameAction: Action types
 * - Quest: Quest type definition for type safety
 * 
 * Used by:
 * - GameContext
 * - QuestManager
 * - Mission components
 */
export const handleQuestAction = (
  state: GameState, 
  action: GameAction
): Partial<GameState> => {
  switch (action.type) {
    case 'UPDATE_QUESTS': {
      return {
        ...state,
        quests: {
          active: action.payload.active || [],
          completed: action.payload.completed || []
        }
      };
    }

    case 'INITIALIZE_QUESTS': {
      const quests = action.payload;
      return {
        ...state,
        quests: {
          active: quests.filter(q => !q.completed),
          completed: quests.filter(q => q.completed)
        }
      };
    }

    case 'UPDATE_QUEST': {
      const updatedQuest: Quest = action.payload;
      const isCompleted = updatedQuest.completed;
      
      return {
        ...state,
        quests: {
          active: isCompleted 
            ? state.quests.active.filter(q => q.id !== updatedQuest.id)
            : state.quests.active.map(q => q.id === updatedQuest.id ? updatedQuest : q),
          completed: isCompleted
            ? [...state.quests.completed, updatedQuest]
            : state.quests.completed
        }
      };
    }

    case 'UPDATE_ITEM': {
      const updatedInventory = state.user.inventory.map(item => 
        item.id === action.payload.id 
          ? { ...item, ...action.payload } as InventoryItem
          : item
      );
      
      return {
        user: {
          ...state.user,
          inventory: updatedInventory
        }
      };
    }

    case 'ADD_ITEM': {
      const newItem: InventoryItem = {
        ...action.payload,
        equipped: false,
        quantity: 1,
        imageUrl: action.payload.imageUrl || ''
      };
      
      return {
        user: {
          ...state.user,
          inventory: [...state.user.inventory, newItem]
        }
      };
    }

    case 'COMPLETE_QUEST': {
      const { quest, rewards } = action.payload;
      const updatedActiveQuests = state.quests.active.filter(q => q.id !== quest.id);
      const updatedCompletedQuests = [...state.quests.completed, quest];

      return {
        quests: {
          active: updatedActiveQuests,
          completed: updatedCompletedQuests
        },
        user: {
          ...state.user,
          xp: state.user.xp + rewards.xp,
          coins: state.user.coins + rewards.coins,
          inventory: rewards.items 
            ? [...state.user.inventory, ...rewards.items]
            : state.user.inventory
        }
      };
    }

    case 'UPDATE_QUEST_PROGRESS': {
      const { questId, progress } = action.payload;
      const updatedQuests = state.quests.active.map(quest => 
        quest.id === questId
          ? { ...quest, progress: Math.min(quest.requirements[0].target, quest.progress + progress) }
          : quest
      );

      return {
        quests: {
          ...state.quests,
          active: updatedQuests
        }
      };
    }

    default:
      return state;
  }
};
