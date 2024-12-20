import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAchievements } from '../../hooks/useAchievements';
import { useRewards } from '../../hooks/useRewards';
import { Trophy, Medal, Star, Award } from 'lucide-react';
import { Achievement, AchievementRarity } from '../../types/achievements';

const rarityConfig = {
  common: { icon: Trophy, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' },
  rare: { icon: Medal, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  epic: { icon: Star, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  legendary: { icon: Award, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' }
};

export function AchievementsPage() {
  const { achievements } = useAchievements();
  const { claimReward } = useRewards();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...new Set(achievements.map(a => a.category))];
  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const groupedAchievements = filteredAchievements.reduce((acc, achievement) => {
    const rarity = achievement.rarity as AchievementRarity;
    if (!acc[rarity]) acc[rarity] = [];
    acc[rarity].push(achievement);
    return acc;
  }, {} as Record<AchievementRarity, Achievement[]>);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Achievements
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your progress and earn rewards
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Achievements List */}
      <div className="space-y-8">
        {(Object.keys(rarityConfig) as AchievementRarity[]).map(rarity => {
          const achievementsInRarity = groupedAchievements[rarity] || [];
          if (achievementsInRarity.length === 0) return null;

          const RarityIcon = rarityConfig[rarity].icon;

          return (
            <div key={rarity}>
              <div className="flex items-center gap-2 mb-4">
                <RarityIcon className={`w-5 h-5 ${rarityConfig[rarity].color}`} />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)} Achievements
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievementsInRarity.map(achievement => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border border-gray-200 dark:border-gray-700 ${
                      rarityConfig[achievement.rarity as AchievementRarity].bg
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${rarityConfig[achievement.rarity as AchievementRarity].bg}`}>
                          {typeof achievement.icon === 'string' ? (
                            <span className="text-2xl">{achievement.icon}</span>
                          ) : (
                            <achievement.icon className={`w-6 h-6 ${rarityConfig[achievement.rarity as AchievementRarity].color}`} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {achievement.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Progress: {achievement.progress}%
                      </p>
                    </div>

                    {/* Claim Button */}
                    {achievement.unlocked && !achievement.claimed && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => claimReward({
                          id: `achievement_${achievement.id}_${Date.now()}`,
                          type: 'xp',
                          value: achievement.points,
                          name: `${achievement.title} Reward`,
                          description: `Reward for completing ${achievement.title}`,
                          amount: 1,
                          rarity: achievement.rarity,
                          metadata: {
                            source: 'achievement',
                            achievement_id: achievement.id
                          }
                        })}
                        className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
                      >
                        Claim {achievement.points} XP
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 