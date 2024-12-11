import type { GameState, GameAction } from './types';
import type { Quest } from '../../types/quests';
import { QuestStatus } from '../../types/quests';
import { QuestService } from '../../services/questService';
import { NotificationSystem } from '../../utils/notifications';

/**
 * Quest Reducer Handler
 * Manages quest-related state updates in the game context
 */
export const handleQuestAction = async (state: GameState, action: GameAction): Promise<GameState> => {
  switch (action.type) {
    case 'INITIALIZE_QUESTS': {
      const { active = [], completed = [] } = action.payload;
      return {
        ...state,
        quests: {
          active,
          completed
        }
      };
    }

    case 'UPDATE_QUEST_PROGRESS': {
      const { questId, progress } = action.payload;
      try {
        await QuestService.updateQuestProgress(state.user.id, questId, progress);

        const updatedActiveQuests = state.quests.active.map(quest => 
          quest.id === questId
            ? { ...quest, progress: Math.min(100, progress) }
            : quest
        );

        const questToUpdate = updatedActiveQuests.find(q => q.id === questId);
        if (questToUpdate && progress >= 100) {
          const completedQuest: Quest = {
            ...questToUpdate,
            status: QuestStatus.COMPLETED,
            progress: 100
          };

          return {
            ...state,
            quests: {
              active: updatedActiveQuests.filter(q => q.id !== questId),
              completed: [...state.quests.completed, completedQuest]
            }
          };
        }

        return {
          ...state,
          quests: {
            ...state.quests,
            active: updatedActiveQuests
          }
        };
      } catch (error) {
        console.error('Failed to update quest progress:', error);
        NotificationSystem.showError('Failed to update quest progress');
        return state;
      }
    }

    case 'COMPLETE_QUEST': {
      const { quest, rewards } = action.payload;
      try {
        await QuestService.updateQuestProgress(state.user.id, quest.id, 100);

        const completedQuest: Quest = {
          ...quest,
          status: QuestStatus.COMPLETED,
          progress: 100
        };

        return {
          ...state,
          quests: {
            active: state.quests.active.filter(q => q.id !== quest.id),
            completed: [...state.quests.completed, completedQuest]
          },
          user: {
            ...state.user,
            xp: state.user.xp + rewards.xp,
            coins: state.user.coins + rewards.coins
          }
        };
      } catch (error) {
        console.error('Failed to complete quest:', error);
        NotificationSystem.showError('Failed to complete quest');
        return state;
      }
    }

    case 'SYNC_QUESTS': {
      try {
        const availableQuests = await QuestService.getQuests();
        const userQuests = await QuestService.getUserQuests(state.user.id);

        const active = availableQuests.filter((q: Quest) => q.status !== QuestStatus.COMPLETED);
        const completed = userQuests.filter((q: Quest) => q.status === QuestStatus.COMPLETED);

        return {
          ...state,
          quests: {
            active,
            completed
          }
        };
      } catch (error) {
        console.error('Failed to sync quests:', error);
        NotificationSystem.showError('Failed to sync quests');
        return state;
      }
    }

    default:
      return state;
  }
};
