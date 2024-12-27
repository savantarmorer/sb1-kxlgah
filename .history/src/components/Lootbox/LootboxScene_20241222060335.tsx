import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, Stars } from 'lucide-react';

interface LootboxSceneProps {
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isOpening: boolean;
  onOpenComplete: () => void;
}

const rarityColors = {
  common: {
    from: 'from-gray-400',
    to: 'to-gray-600',
    glow: 'rgba(156, 163, 175, 0.5)',
    particles: 'text-gray-300'
  },
  rare: {
    from: 'from-blue-400',
    to: 'to-blue-600',
    glow: 'rgba(59, 130, 246, 0.5)',
    particles: 'text-blue-300'
  },
  epic: {
    from: 'from-purple-400',
    to: 'to-purple-600',
    glow: 'rgba(139, 92, 246, 0.5)',
    particles: 'text-purple-300'
  },
  legendary: {
    from: 'from-yellow-400',
    to: 'to-yellow-600',
    glow: 'rgba(245, 158, 11, 0.5)',
    particles: 'text-yellow-300'
  }
};

const ParticleRing = ({ color, isOpening }: { color: string; isOpening: boolean }) => {
  return (
    <motion.div
      initial={false}
      animate={isOpening ? {
        scale: [1, 1.5, 2],
        opacity: [0.8, 0.4, 0]
      } : {
        scale: [1, 1.2, 1],
        opacity: [0.2, 0.4, 0.2]
      }}
      transition={{
        duration: isOpening ? 0.5 : 2,
        repeat: isOpening ? 0 : Infinity,
        ease: isOpening ? "easeOut" : "linear"
      }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div className="relative w-full h-full">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${color}`}
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${i * 30}deg) translateY(-40px)`
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default function LootboxScene({ rarity, isOpening, onOpenComplete }: LootboxSceneProps) {
  const [animationStage, setAnimationStage] = useState(0);
  const colors = rarityColors[rarity];

  useEffect(() => {
    if (isOpening) {
      // Reset animation stage when opening starts
      setAnimationStage(0);
      
      // Stage timing sequence
      const timings = [
        { stage: 1, delay: 300 },  // Initial glow
        { stage: 2, delay: 800 },  // Build up
        { stage: 3, delay: 1200 }, // Final burst
        { stage: 4, delay: 1800 }  // Complete
      ];

      timings.forEach(({ stage, delay }) => {
        setTimeout(() => setAnimationStage(stage), delay);
      });
    } else {
      setAnimationStage(0);
    }
  }, [isOpening]);

  useEffect(() => {
    if (animationStage === 4) {
      onOpenComplete();
    }
  }, [animationStage, onOpenComplete]);

  return (
    <div className="w-full h-64 flex items-center justify-center">
      <div className="relative">
        {/* Background particle rings */}
        <AnimatePresence>
          {isOpening && [...Array(3)].map((_, i) => (
            <ParticleRing key={i} color={colors.particles} isOpening={isOpening} />
          ))}
        </AnimatePresence>

        {/* Main lootbox */}
        <motion.div
          animate={
            animationStage === 0 ? {
              rotate: [0, 10, -10, 0],
              y: [0, -5, 0]
            } : animationStage === 1 ? {
              scale: [1, 1.1],
              rotate: [0, 0]
            } : animationStage === 2 ? {
              scale: 1.1,
              rotate: [0, 360],
            } : animationStage === 3 ? {
              scale: [1.1, 1.3, 0],
              rotate: 720,
              y: [0, -30, 50]
            } : { scale: 0 }
          }
          transition={
            animationStage === 0 ? {
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            } : animationStage === 1 ? {
              duration: 0.3,
              ease: "easeInOut"
            } : animationStage === 2 ? {
              duration: 0.5,
              ease: "easeInOut"
            } : {
              duration: 0.6,
              ease: "easeOut"
            }
          }
          className={`w-32 h-32 relative rounded-lg bg-gradient-to-br ${colors.from} ${colors.to}`}
          style={{
            boxShadow: `0 0 ${animationStage > 0 ? '30px' : '15px'} ${colors.glow}`
          }}
        >
          {/* Gift icon */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            animate={
              animationStage > 1 ? {
                scale: [1, 1.2],
                opacity: [1, 0]
              } : {
                scale: 1,
                opacity: 1
              }
            }
          >
            <Gift className="text-white" size={48} />
          </motion.div>

          {/* Sparkle effects */}
          <AnimatePresence>
            {(animationStage === 0 || animationStage === 1) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.8, 1.2, 0.8],
                  rotate: [0, 180, 360]
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  duration: animationStage === 0 ? 2 : 0.5,
                  repeat: animationStage === 0 ? Infinity : 0,
                  ease: "linear"
                }}
                className="absolute -inset-4"
              >
                <Sparkles className={`w-full h-full ${colors.particles}`} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Build-up particles */}
          <AnimatePresence>
            {animationStage >= 2 && animationStage < 4 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [1, 2],
                  rotate: [0, 90]
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <Stars className={`w-full h-full ${colors.particles}`} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Final burst effect */}
        <AnimatePresence>
          {animationStage === 3 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [1, 3],
                opacity: [1, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className={`absolute inset-0 rounded-full ${colors.from}`}
              style={{
                filter: 'blur(10px)'
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}