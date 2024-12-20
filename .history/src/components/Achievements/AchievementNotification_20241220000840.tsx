import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Share2, X } from 'lucide-react';
import { Achievement } from '../../types/achievements';
import { useSound } from '../../hooks/useSound';
import { Button } from '../ui/Button';
import confetti from 'canvas-confetti';

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
  onShare?: () => void;
}

export default function AchievementNotification({
  achievement,
  onClose,
  onShare
}: AchievementNotificationProps) {
  const unlockSound = useSound('/sounds/achievement-unlock.mp3');

  React.useEffect(() => {
    // Play sound effect
    unlockSound.play();

    // Trigger confetti effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Auto close after 5 seconds
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, []);

  const rarityColors = {
    common: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    rare: 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    epic: 'bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    legendary: 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
  };

  const iconColors = {
    common: 'text-gray-600 dark:text-gray-400',
    rare: 'text-blue-600 dark:text-blue-400',
    epic: 'text-purple-600 dark:text-purple-400',
    legendary: 'text-yellow-600 dark:text-yellow-400'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.3 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.3 }}
        className={`
          fixed bottom-20 right-4 max-w-sm rounded-lg shadow-lg p-4 border
          ${rarityColors[achievement.rarity]}
          z-50
        `}
      >
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-full ${rarityColors[achievement.rarity]}`}>
            <Trophy className={`w-6 h-6 ${iconColors[achievement.rarity]}`} />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Achievement Unlocked!
                </h3>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">
                  {achievement.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {achievement.description}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Star className={iconColors[achievement.rarity]} size={16} />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  +{achievement.points} points
                </span>
              </div>

              {onShare && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onShare}
                  className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Share2 size={16} className="mr-1" />
                  Share
                </Button>
              )}
            </div>
          </div>
        </div>

        <motion.div
          className="absolute inset-0 rounded-lg"
          initial={{ opacity: 0.5 }}
          animate={{
            opacity: [0.5, 0.2, 0.5],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            background: `linear-gradient(45deg, transparent, ${
              achievement.rarity === 'legendary' ? '#FFD700' :
              achievement.rarity === 'epic' ? '#9B59B6' :
              achievement.rarity === 'rare' ? '#3498DB' :
              '#95A5A6'
            }20, transparent)`,
            zIndex: -1
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}