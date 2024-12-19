import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Swords } from 'lucide-react';
import { use_language } from '../../contexts/LanguageContext';

interface ScoreDisplayProps {
  score_player: number;
  score_opponent: number;
  streak: number;
  time_left: number;
}

export function ScoreDisplay({ 
  score_player, 
  score_opponent, 
  streak,
  time_left 
}: ScoreDisplayProps) {
  const { t } = use_language();

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-4"
    >
      <div className="flex justify-between items-center">
        {/* Player Score */}
        <div className="text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-3xl font-bold text-cyan-400"
          >
            {score_player}
          </motion.div>
          <p className="text-sm text-gray-400">{t('battle.you')}</p>
        </div>

        {/* VS and Timer */}
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-2">
            <Swords className="w-6 h-6 text-indigo-400" />
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-medium text-gray-400"
          >
            {time_left}s
          </motion.div>
        </div>

        {/* Opponent Score */}
        <div className="text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-3xl font-bold text-red-400"
          >
            {score_opponent}
          </motion.div>
          <p className="text-sm text-gray-400">{t('battle.opponent')}</p>
        </div>
      </div>

      {/* Streak Display */}
      {streak > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-4 border-t border-white/10"
        >
          <div className="flex items-center justify-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-medium text-orange-400">
              {streak} {t('battle.streak')}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
