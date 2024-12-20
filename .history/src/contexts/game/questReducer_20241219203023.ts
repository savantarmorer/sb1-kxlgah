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
    case 'UPDATE_QUESTS': {
      if ('questId' in action.payload && 'progress' in action.payload) {
        // Handle quest progress update
        const { questId, progress } = action.payload as { questId: string; progress: number };
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
      } else {
        // Handle quest list update
        const { active = [], completed = [] } = action.payload;
        return {
          ...state,
          quests: {
            active,
            completed
          }
        };
      }
    }

    default:
      return state;
  }
};
