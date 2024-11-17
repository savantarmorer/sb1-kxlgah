import React from 'react';
import { useGame } from '../contexts/GameContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function QuestSystem() {
  const { state } = useGame();
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-white">
        {t('quests.title')}
      </h2>
      <div className="grid gap-4">
        {state.quests?.map((quest) => (
          <div
            key={quest.id}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
          >
            <h3 className="font-semibold">{quest.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {quest.description}
            </p>
            {/* Add quest details and progress here */}
          </div>
        ))}
      </div>
    </div>
  );
}