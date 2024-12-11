import React, { useEffect } from 'react';
import { use_game } from '../../contexts/GameContext';
import { QuestService } from '../../services/questService';
import { Quest, QuestStatus } from '../../types/quests';

export default function UserProgress() {
  const { state, dispatch } = use_game();

  useEffect(() => {
    loadQuests();
  }, [state.user.id]);

  const loadQuests = async () => {
    const quests = await QuestService.getUserQuests(state.user.id);
    dispatch({ 
      type: 'INITIALIZE_QUESTS', 
      payload: {
        active: quests.filter(q => q.status !== QuestStatus.COMPLETED),
        completed: quests.filter(q => q.status === QuestStatus.COMPLETED)
      }
    });
  };

  const handleQuestComplete = async (quest: Quest) => {
    const quests = await QuestService.completeQuest(state.user.id, quest.id);
    await QuestService.grantRewards(state.user.id, quest);
    // Update quests in state
    dispatch({ 
      type: 'INITIALIZE_QUESTS', 
      payload: {
        active: quests.filter(q => !q.completed),
        completed: quests.filter(q => q.completed)
      }
    });
  };

  const getQuestProgress = (quest: Quest) => {
    const total = quest.requirements.reduce((sum, req) => sum + req.target, 0);
    const current = quest.requirements.reduce((sum, req) => sum + req.current, 0);
    return { current, total };
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Active Quests</h2>
      <div className="space-y-4">
        {state.quests?.active.map(quest => {
          const { current, total } = getQuestProgress(quest);
          return (
            <div key={quest.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold">{quest.title}</h3>
              <p className="text-gray-600">{quest.description}</p>
              <div className="mt-2">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 rounded-full h-2"
                    style={{ width: `${(current / total) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Progress: {current} / {total}
                </p>
              </div>
              {current >= total && (
                <button
                  onClick={() => handleQuestComplete(quest)}
                  className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Complete Quest
                </button>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">Completed Quests</h2>
      <div className="space-y-4">
        {state.quests?.completed.map(quest => (
          <div key={quest.id} className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold">{quest.title}</h3>
            <p className="text-gray-600">{quest.description}</p>
            <p className="text-sm text-green-500 mt-2">Completed!</p>
          </div>
        ))}
      </div>
    </div>
  );
} 