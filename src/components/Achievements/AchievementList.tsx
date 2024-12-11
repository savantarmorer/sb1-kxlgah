import React from 'react';
import { Achievement } from '../../types/achievements';
import { AchievementCard } from './AchievementCard';
import { motion } from 'framer-motion';

interface AchievementListProps {
  achievements: Achievement[];
  category?: string;
}

export function AchievementList({ achievements, category }: AchievementListProps) {
  const filteredAchievements = category
    ? achievements.filter(a => a.category === category)
    : achievements;

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {filteredAchievements.map((achievement, index) => (
        <motion.div
          key={achievement.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <AchievementCard achievement={achievement} />
        </motion.div>
      ))}
      {filteredAchievements.length === 0 && (
        <div className="col-span-full text-center py-8 text-gray-500">
          No achievements found in this category.
        </div>
      )}
    </motion.div>
  );
} 