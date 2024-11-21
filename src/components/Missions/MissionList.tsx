import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Star, CheckCircle2, Circle } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LootBox from '../LootBox';

function getTimeRemaining(deadline: Date) {
  const total = deadline.getTime() - Date.now();
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  return `${hours}h ${minutes}m`;
}

export default function MissionList() {
  const { state, dispatch } = useGame();
  const { t } = useLanguage();
  const [showLootBox, setShowLootBox] = useState(false);
  const [currentRewards, setCurrentRewards] = useState<any[]>([]);

  // Ensure quests exist with a default empty array
  const quests = state.quests || [];

  const canCompleteMission = (mission: any) => {
    if (mission.requirements) {
      return mission.requirements.every((req: any) => {
        switch (req.type) {
          case 'level':
            return state.user.level >= req.value;
          case 'streak':
            return state.user.streak >= req.value;
          case 'xp':
            return state.user.xp >= req.value;
          default:
            return true;
        }
      });
    }
    return true;
  };

  const handleCompleteMission = (mission: any) => {
    if (!canCompleteMission(mission)) return;

    const rewards = [
      {
        type: 'xp',
        value: mission.xpReward,
        rarity: mission.type === 'epic' ? 'legendary' : 'rare'
      },
      {
        type: 'coins',
        value: mission.coinReward,
        rarity: 'common'
      }
    ];

    setCurrentRewards(rewards);
    setShowLootBox(true);

    dispatch({ type: 'COMPLETE_QUEST', payload: mission.id });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('common.missions')}
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Timer size={16} />
          <span>Resets in {getTimeRemaining(new Date(Date.now() + 24 * 60 * 60 * 1000))}</span>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {quests.map((mission) => (
            <motion.div
              key={mission.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-lg border ${
                state.completedQuests.includes(mission.id)
                  ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                  : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    {state.completedQuests.includes(mission.id) ? (
                      <CheckCircle2 className="text-green-500" size={20} />
                    ) : (
                      <Circle className="text-gray-400 dark:text-gray-500" size={20} />
                    )}
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {mission.title}
                    </h3>
                    <span className={`badge ${
                      mission.type === 'epic' ? 'badge-warning' :
                      mission.type === 'weekly' ? 'badge-info' :
                      'badge-success'
                    }`}>
                      {mission.type === 'weekly' ? 'Semanal' : 
                       mission.type === 'epic' ? 'Épica' : 'Diária'}
                    </span>
                  </div>
                  <p className="text-muted mt-1 ml-7">{mission.description}</p>
                  {mission.requirements && (
                    <ul className="mt-2 ml-7 space-y-1">
                      {mission.requirements.map((req: string, index: number) => (
                        <li key={index} className="flex items-center space-x-2 text-muted">
                          <Circle size={6} />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-primary">
                      <Star size={16} />
                      <span className="font-medium">+{mission.xpReward} XP</span>
                    </div>
                    <div className="flex items-center space-x-1 text-yellow-600 dark:text-yellow-400">
                      <Star size={16} />
                      <span className="font-medium">+{mission.coinReward} Coins</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCompleteMission(mission)}
                    disabled={state.completedQuests.includes(mission.id)}
                    className={`btn ${
                      state.completedQuests.includes(mission.id)
                        ? 'btn-secondary opacity-50 cursor-not-allowed'
                        : 'btn-primary'
                    }`}
                  >
                    {state.completedQuests.includes(mission.id) ? 'Completed' : 'Complete'}
                  </button>
                </div>
              </div>

              {mission.progress !== undefined && (
                <div className="mt-3 ml-7">
                  <div className="flex justify-between text-xs text-muted mb-1">
                    <span>{t('common.progress')}</span>
                    <span>{mission.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${mission.progress}%` }}
                      className="h-full bg-indigo-600 dark:bg-indigo-500"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <LootBox
        isOpen={showLootBox}
        onClose={() => setShowLootBox(false)}
        rewards={currentRewards}
      />
    </div>
  );
}