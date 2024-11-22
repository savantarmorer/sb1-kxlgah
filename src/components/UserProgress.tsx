import React from 'react';
import { useLevelSystem } from '../hooks/useLevelSystem';
import { useGame } from '../contexts/GameContext';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import UserSettings from './UserSettings';

interface UserProgressProps {
  showSettings?: boolean;
}

export default function UserProgress({ showSettings = false }: UserProgressProps) {
  const { state } = useGame();
  const { currentLevel, progress, xpToNextLevel } = useLevelSystem();
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium dark:text-gray-200">
            Level {currentLevel}
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {xpToNextLevel} XP to next level
          </span>
        </div>

        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500 dark:bg-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <div>
            <span className="font-medium dark:text-gray-200">
              {state.user.coins}
            </span>
            <span className="text-gray-600 dark:text-gray-400 ml-1">Coins</span>
          </div>
          <div>
            <span className="font-medium dark:text-gray-200">
              {state.user.streak}
            </span>
            <span className="text-gray-600 dark:text-gray-400 ml-1">Streak</span>
          </div>
        </div>
      </div>

      {showSettings && (
        <button
          onClick={() => setShowSettingsModal(true)}
          className="ml-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Settings size={20} />
        </button>
      )}

      {showSettingsModal && (
        <UserSettings onClose={() => setShowSettingsModal(false)} />
      )}
    </div>
  );
}