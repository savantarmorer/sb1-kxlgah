<<<<<<< HEAD
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Star, Sparkles } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useLanguage } from '../contexts/LanguageContext';
import Button from './Button';
=======
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { Gift, Sparkles, Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useGame } from '../contexts/GameContext';

interface Reward {
  type: 'xp' | 'coins' | 'item';
  value: number | string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d

interface LootBoxProps {
  isOpen: boolean;
  onClose: () => void;
<<<<<<< HEAD
  rewards: Array<{
    type: string;
    value: number | string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
  source?: 'level_up' | 'daily_reward' | 'quest';
}

export default function LootBox({ isOpen, onClose, rewards, source }: LootBoxProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const { dispatch } = useGame();
  const { t } = useLanguage();

  const highestRarity = rewards.reduce((highest, reward) => {
    const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
    return rarityOrder[reward.rarity] > rarityOrder[highest] ? reward.rarity : highest;
  }, 'common' as 'common' | 'rare' | 'epic' | 'legendary');

  const handleOpen = () => {
    setIsOpening(true);
    setTimeout(() => {
      setShowRewards(true);
      rewards.forEach(reward => {
=======
  rewards: Reward[];
}

const rarityColors = {
  common: 'from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-600',
  rare: 'from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600',
  epic: 'from-purple-400 to-purple-500 dark:from-purple-500 dark:to-purple-600',
  legendary: 'from-yellow-400 to-yellow-500 dark:from-yellow-500 dark:to-yellow-600'
};

const rarityGlowColors = {
  common: 'shadow-gray-400/50 dark:shadow-gray-500/50',
  rare: 'shadow-blue-400/50 dark:shadow-blue-500/50',
  epic: 'shadow-purple-400/50 dark:shadow-purple-500/50',
  legendary: 'shadow-yellow-400/50 dark:shadow-yellow-500/50'
};

const rarityAnimations = {
  common: { duration: 1, scale: [1, 1.1, 1] },
  rare: { duration: 1.5, scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] },
  epic: { duration: 2, scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] },
  legendary: { duration: 2.5, scale: [1, 1.4, 1], rotate: [0, 20, -20, 0] }
};

export default function LootBox({ isOpen, onClose, rewards }: LootBoxProps) {
  const { t } = useLanguage();
  const { dispatch } = useGame();
  const [isRevealed, setIsRevealed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentRewardIndex, setCurrentRewardIndex] = useState(-1);
  const [isOpening, setIsOpening] = useState(false);
  const [determinedRarity, setDeterminedRarity] = useState<string | null>(null);
  const hasLegendary = rewards.some(reward => reward.rarity === 'legendary');

  useEffect(() => {
    if (isOpen) {
      setIsRevealed(false);
      setShowConfetti(false);
      setCurrentRewardIndex(-1);
      setIsOpening(false);
      setDeterminedRarity(null);
    }
  }, [isOpen]);

  const handleReveal = async () => {
    if (isOpening) return;
    setIsOpening(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setDeterminedRarity('determining');
    
    const highestRarity = rewards.reduce((highest, reward) => {
      const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
      return rarityOrder[reward.rarity] > rarityOrder[highest] ? reward.rarity : highest;
    }, 'common' as Reward['rarity']);
    
    const pauseDuration = {
      common: 1000,
      rare: 1500,
      epic: 2000,
      legendary: 2500
    }[highestRarity];
    
    await new Promise(resolve => setTimeout(resolve, pauseDuration));
    setDeterminedRarity(highestRarity);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRevealed(true);
    setShowConfetti(true);
    revealRewards();
  };

  const revealRewards = () => {
    let delay = 0;
    rewards.forEach((reward, index) => {
      setTimeout(() => {
        setCurrentRewardIndex(index);
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
        if (reward.type === 'xp') {
          dispatch({
            type: 'ADD_XP',
            payload: {
              amount: reward.value as number,
<<<<<<< HEAD
              reason: 'Lootbox Reward'
=======
              reason: `${t('lootbox.reward')} (${t(`items.rarity.${reward.rarity}`)})`
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
            }
          });
        } else if (reward.type === 'coins') {
          dispatch({
            type: 'ADD_COINS',
            payload: reward.value as number
          });
<<<<<<< HEAD
        }
      });
    }, 2000);
  };

  const handleClaimRewards = () => {
    rewards.forEach(reward => {
      dispatch({
        type: 'CLAIM_REWARD',
        payload: {
          type: reward.type,
          value: typeof reward.value === 'string' ? parseInt(reward.value, 10) : reward.value,
          rarity: reward.rarity
        }
      });
    });

    if (source === 'level_up') {
      const legendaryReward = rewards.find(r => r.rarity === 'legendary');
      if (legendaryReward) {
        dispatch({
          type: 'UNLOCK_ACHIEVEMENT',
          payload: {
            id: 'legendary_reward',
            title: 'Legendary Fortune',
            description: 'Obtain a legendary reward',
            category: 'rewards',
            points: 100,
            rarity: 'legendary',
            unlocked: true,
            unlockedAt: new Date(),
            prerequisites: [],
            dependents: [],
            triggerConditions: [{
              type: 'reward_rarity',
              value: 4,
              comparison: 'eq'
            }],
            order: 100
          }
        });
      }
    }

    onClose();
  };

=======
        } else if (reward.type === 'item') {
          dispatch({
            type: 'PURCHASE_ITEM',
            payload: {
              itemId: `reward_${Date.now()}`,
              cost: 0,
              item: {
                name: reward.value,
                rarity: reward.rarity,
                type: 'material'
              }
            }
          });
        }
      }, delay);
      delay += 800;
    });
  };

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    >
<<<<<<< HEAD
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
      >
        <AnimatePresence mode="wait">
          {!showRewards ? (
            <motion.div
              key="lootbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
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
                className={`w-32 h-32 mx-auto mb-6 rounded-lg relative ${
                  highestRarity === 'legendary' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                  highestRarity === 'epic' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                  highestRarity === 'rare' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                  'bg-gradient-to-br from-gray-400 to-gray-600'
                }`}
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
                      highestRarity === 'legendary' ? 'text-yellow-300' :
                      highestRarity === 'epic' ? 'text-purple-300' :
                      highestRarity === 'rare' ? 'text-blue-300' :
                      'text-gray-300'
                    }`} />
                  </motion.div>
                )}
              </motion.div>
              {!isOpening && (
                <Button
                  variant="primary"
                  onClick={handleOpen}
                  className="mt-4"
                >
                  Open Lootbox
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="rewards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">
                Rewards Unlocked!
              </h2>
              {rewards.map((reward, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className={`p-4 rounded-lg ${
                    reward.rarity === 'legendary' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                    reward.rarity === 'epic' ? 'bg-purple-100 dark:bg-purple-900/30' :
                    reward.rarity === 'rare' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    'bg-gray-100 dark:bg-gray-900/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium dark:text-white">
                      {reward.type === 'xp' && `+${reward.value} XP`}
                      {reward.type === 'coins' && `+${reward.value} Coins`}
                      {reward.type === 'item' && reward.value}
                    </span>
                    <Star className={
                      reward.rarity === 'legendary' ? 'text-yellow-500' :
                      reward.rarity === 'epic' ? 'text-purple-500' :
                      reward.rarity === 'rare' ? 'text-blue-500' :
                      'text-gray-500'
                    } />
                  </div>
                </motion.div>
              ))}
              <Button
                variant="primary"
                onClick={handleClaimRewards}
                className="w-full mt-6"
              >
                Continue
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
=======
      {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={hasLegendary ? 500 : 200}
          colors={hasLegendary ? ['#FFD700', '#FFA500', '#FF8C00'] : undefined}
        />
      )}
      
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
      >
        {!isRevealed ? (
          <motion.div
            className="text-center"
            whileHover={!isOpening ? { scale: 1.05 } : undefined}
            whileTap={!isOpening ? { scale: 0.95 } : undefined}
            onClick={() => !isOpening && handleReveal()}
          >
            <Gift size={64} className="mx-auto mb-4 text-indigo-500" />
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              {isOpening ? t('lootbox.opening') : t('lootbox.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {determinedRarity === 'determining' 
                ? t('lootbox.determining')
                : determinedRarity 
                  ? t(`lootbox.rarityFound.${determinedRarity}`)
                  : t('lootbox.clickToOpen')}
            </p>
            <motion.div
              className="relative w-32 h-32 mx-auto"
              animate={isOpening ? {
                rotateY: [0, 360],
                scale: [1, 1.2, 1],
              } : {
                rotateY: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: isOpening ? 2 : 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div
                className={`absolute inset-0 rounded-lg shadow-[0_0_50px_10px] ${
                  determinedRarity && determinedRarity !== 'determining'
                    ? rarityGlowColors[determinedRarity as keyof typeof rarityGlowColors]
                    : 'shadow-indigo-400/50 dark:shadow-indigo-500/50'
                }`}
              >
                <div
                  className={`w-full h-full rounded-lg bg-gradient-to-br ${
                    determinedRarity && determinedRarity !== 'determining'
                      ? rarityColors[determinedRarity as keyof typeof rarityColors]
                      : 'from-indigo-400 to-indigo-500 dark:from-indigo-500 dark:to-indigo-600'
                  } flex items-center justify-center`}
                >
                  <Sparkles className="text-white" size={48} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
              {t('lootbox.rewardsUnlocked')}
            </h2>
            {rewards.map((reward, index) => (
              <motion.div
                key={index}
                initial={{ x: -50, opacity: 0 }}
                animate={currentRewardIndex >= index ? {
                  x: 0,
                  opacity: 1,
                  ...rarityAnimations[reward.rarity]
                } : {}}
                transition={{ delay: index * 0.2 }}
                className={`p-4 rounded-lg bg-gradient-to-r ${rarityColors[reward.rarity]} text-white`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="animate-pulse" size={20} />
                    <span className="font-bold">
                      {reward.type === 'xp' && `+${reward.value} XP`}
                      {reward.type === 'coins' && `+${reward.value} ${t('common.coins')}`}
                      {reward.type === 'item' && reward.value}
                    </span>
                  </div>
                  <span className="text-sm opacity-75">
                    {t(`items.rarity.${reward.rarity}`)}
                  </span>
                </div>
              </motion.div>
            ))}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-full mt-6 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              {t('common.continue')}
            </motion.button>
          </div>
        )}
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
      </motion.div>
    </motion.div>
  );
}