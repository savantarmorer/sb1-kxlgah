import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Shield, Target, Swords, Book, Crown } from 'lucide-react';
import { use_game } from '../../contexts/GameContext';
import { Achievement, AchievementTriggerType } from '../../types/achievements';

const CATEGORIES = [
  { id: 'battle', label: 'Battle', icon: Swords, color: 'text-red-500' },
  { id: 'progress', label: 'Progress', icon: Target, color: 'text-blue-500' },
  { id: 'collection', label: 'Collection', icon: Star, color: 'text-yellow-500' },
  { id: 'mastery', label: 'Mastery', icon: Crown, color: 'text-purple-500' }
];

export const ACHIEVEMENT_CATEGORIES = [
  // Define categories here
];

export default function AchievementSystem() {
  const { state, dispatch } = use_game();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showClaimed, setShowClaimed] = useState(true);

  const achievements: Achievement[] = [
    {
      id: 'first_victory',
      title: 'First Victory',
      description: 'Win your first battle',
      category: 'battle',
      icon: Swords,
      progress: state.battle_stats?.wins || 0,
      total: 1,
      completed: (state.battle_stats?.wins || 0) >= 1,
      claimed: false,
      rarity: 'common',
      points: 100,
      unlocked: false,
      max_progress: 1,
      prerequisites: [],
      dependents: [],
      order: 1,
      trigger_conditions: [{
        type: 'battle_wins' as AchievementTriggerType,
        value: 1,
        comparison: 'gte'
      }],
      order_num: 1,
      metadata: {}
    },
    // Add more achievements here
  ];

  const filteredAchievements = achievements.filter(achievement => 
    (selectedCategory === 'all' || achievement.category === selectedCategory) &&
    (showClaimed || !achievement.claimed)
  );

  const handleClaim = (achievement: Achievement) => {
    if (achievement.completed && !achievement.claimed) {
      dispatch({
        type: 'UNLOCK_ACHIEVEMENT',
        payload: achievement
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Achievements
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {state.achievements?.filter(a => a.unlocked)?.length || 0} / {achievements.length} Completed
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowClaimed(!showClaimed)}
              className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {showClaimed ? 'Hide Claimed' : 'Show All'}
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Trophy size={20} />
            <span>All</span>
          </button>
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                selectedCategory === category.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <category.icon size={20} className={category.color} />
              <span>{category.label}</span>
            </button>
          ))}
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${
                      achievement.completed ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <achievement.icon 
                        size={24} 
                        className={achievement.completed ? 'text-green-500' : 'text-gray-400'} 
                      />
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
                  {achievement.rarity !== 'common' && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      achievement.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                      achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {achievement.rarity}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      Progress
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {achievement.progress} / {achievement.total}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                      className={`h-full rounded-full ${
                        achievement.completed ? 'bg-green-500' : 'bg-indigo-600'
                      }`}
                    />
                  </div>
                </div>

                {achievement.completed && !achievement.claimed && (
                  <button
                    onClick={() => handleClaim(achievement)}
                    className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Claim Reward
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}