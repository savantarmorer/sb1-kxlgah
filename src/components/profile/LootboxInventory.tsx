import React from 'react';
import { motion } from 'framer-motion';
import { Gift, ChevronRight, Lock, Info } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';

interface LootboxItem {
  id: string;
  type: 'common' | 'rare' | 'epic' | 'legendary';
  unlocksAt?: number;
  progress?: number;
}

const LOOTBOX_COLORS = {
  common: 'from-cyan-500 to-blue-600',
  rare: 'from-violet-500 to-purple-600',
  epic: 'from-fuchsia-500 to-pink-600',
  legendary: 'from-amber-500 to-yellow-600'
};

const LOOTBOX_SHADOWS = {
  common: 'shadow-cyan-500/50',
  rare: 'shadow-violet-500/50',
  epic: 'shadow-fuchsia-500/50',
  legendary: 'shadow-amber-500/50'
};

const LOOTBOX_GLOWS = {
  common: 'group-hover:shadow-cyan-500/50',
  rare: 'group-hover:shadow-violet-500/50',
  epic: 'group-hover:shadow-fuchsia-500/50',
  legendary: 'group-hover:shadow-amber-500/50'
};

export default function LootboxInventory() {
  const { state } = useGame();
  
  // Mock data - replace with actual data from state
  const lootboxes: LootboxItem[] = [
    { id: '1', type: 'common', progress: 75 },
    { id: '2', type: 'rare', progress: 45 },
    { id: '3', type: 'epic', unlocksAt: 10 },
    { id: '4', type: 'legendary', unlocksAt: 20 }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {lootboxes.map((lootbox) => (
          <motion.div
            key={lootbox.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className={`group relative overflow-hidden rounded-xl bg-gray-900 shadow-lg transition-all duration-300 ${
              !lootbox.unlocksAt && LOOTBOX_SHADOWS[lootbox.type]
            } hover:shadow-xl ${!lootbox.unlocksAt && LOOTBOX_GLOWS[lootbox.type]}`}
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br opacity-20 ${
              lootbox.unlocksAt 
                ? 'from-gray-600 to-gray-700'
                : LOOTBOX_COLORS[lootbox.type]
            }`} />

            {/* Content */}
            <div className="relative p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`relative rounded-lg p-2 ${
                    lootbox.unlocksAt 
                      ? 'bg-gray-800'
                      : 'bg-gradient-to-br ' + LOOTBOX_COLORS[lootbox.type]
                  }`}>
                    <Gift className={`w-6 h-6 ${
                      lootbox.unlocksAt ? 'text-gray-400' : 'text-white'
                    }`} />
                    {lootbox.unlocksAt && (
                      <Lock className="absolute -top-1 -right-1 w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className={`font-semibold capitalize ${
                      lootbox.unlocksAt ? 'text-gray-400' : 'text-white'
                    }`}>
                      {lootbox.type} Lootbox
                    </h3>
                    {lootbox.unlocksAt ? (
                      <p className="text-xs text-gray-500">
                        Unlocks at Level {lootbox.unlocksAt}
                      </p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${lootbox.progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full bg-gradient-to-r ${LOOTBOX_COLORS[lootbox.type]}`}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{lootbox.progress}%</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {!lootbox.unlocksAt && (
                  <button 
                    className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                    title="View Details"
                  >
                    <Info className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Animated glow effect */}
            {!lootbox.unlocksAt && (
              <motion.div
                className={`absolute inset-0 bg-gradient-to-r opacity-20 ${LOOTBOX_COLORS[lootbox.type]}`}
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
} 