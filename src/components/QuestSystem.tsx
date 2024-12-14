import React from 'react';
import { useGame } from '../contexts/GameContext';
import { use_language } from '../contexts/LanguageContext';
import { QuestType } from '../types/quests';

export default function QuestSystem() {
  const { state } = useGame();
  const { t } = use_language();

  const activeQuests = state.quests?.active || [];
  const completedQuests = state.quests?.completed || [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-white">
        {t('quests.title')}
      </h2>
      
      {/* Active Quests */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold dark:text-white">
          {t('quests.active')}
        </h3>
        <div className="grid gap-4">
          {activeQuests.map((quest) => (
            <div
              key={quest.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
            >
              <h3 className="font-semibold">{quest.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {quest.description}
              </p>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Progress</span>
                  <span>{quest.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${quest.progress}%` }}
                  ></div>
                </div>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`badge ${
                    quest.type === QuestType.STORY ? 'badge-warning' :
                    quest.type === QuestType.WEEKLY ? 'badge-info' :
                    'badge-success'
                  }`}>
                    {quest.type}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    XP: {quest.xp_reward} | Coins: {quest.coin_reward}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completed Quests */}
      {completedQuests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold dark:text-white">
            {t('quests.completed')}
          </h3>
          <div className="grid gap-4">
            {completedQuests.map((quest) => (
              <div
                key={quest.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow opacity-75"
              >
                <h3 className="font-semibold">{quest.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {quest.description}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="badge badge-success">Completed</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Earned: {quest.xp_reward} XP | {quest.coin_reward} Coins
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}