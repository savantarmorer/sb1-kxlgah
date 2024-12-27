import React from 'react';
import { motion } from 'framer-motion';
import { Scroll, Star, Gift, X } from 'lucide-react';
import { Quest } from '../../../types/quests';

export interface QuestToastProps {
  visible: boolean;
  quest: Quest;
}

export function QuestToast({ visible, quest }: QuestToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -20 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-[300px] border-l-4 border-indigo-500 flex items-center space-x-3"
    >
      <Gift className="text-indigo-500" size={24} />
      <div className="flex-1">
        <p className="font-medium text-gray-900 dark:text-white">
          Quest Completed: {quest.title}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Rewards: +{quest.xp_reward} XP, +{quest.coin_reward} Coins
        </p>
      </div>
      <button onClick={() => {/* Close toast logic */}} className="text-gray-400 hover:text-gray-600">
        <X size={16} />
      </button>
    </motion.div>
  );
} 

