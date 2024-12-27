import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Sparkles } from 'lucide-react';

interface LootboxSceneProps {
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isOpening: boolean;
  onOpenComplete: () => void;
}

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-yellow-600'
};

export default function LootboxScene({ rarity, isOpening, onOpenComplete }: LootboxSceneProps) {
  return (
    <div className="w-full h-64 flex items-center justify-center">
      <motion.div
        animate={isOpening ? {
          scale: [1, 1.2, 0],
          rotate: [0, 15, -15, 360],
          y: [0, -20, 50]
        } : {
          rotate: [0, 10, -10, 0],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }
        }}
        onAnimationComplete={() => {
          if (isOpening) {
            onOpenComplete();
          }
        }}
        className={`w-32 h-32 relative rounded-lg bg-gradient-to-br ${rarityColors[rarity]}`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <Gift className="text-white" size={48} />
        </div>
        {!isOpening && (
          <motion.div
            animate={{
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -inset-2"
          >
            <Sparkles className={`w-full h-full ${
              rarity === 'legendary' ? 'text-yellow-300' :
              rarity === 'epic' ? 'text-purple-300' :
              rarity === 'rare' ? 'text-blue-300' :
              'text-gray-300'
            }`} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}