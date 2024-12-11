import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, Tab, Box, Typography, LinearProgress } from '@mui/material';
import { useAchievements } from '../hooks/useAchievements';
import { AchievementList } from '../components/Achievements/AchievementList';
import { ACHIEVEMENT_CATEGORIES } from '../constants/achievements';
import { Trophy } from 'lucide-react';

export function AchievementsPage() {
  const { achievements } = useAchievements();
  const [category, setCategory] = React.useState<string>('all');

  const totalPoints = achievements.reduce((sum, a) => sum + (a.unlocked ? a.points : 0), 0);
  const totalPossiblePoints = achievements.reduce((sum, a) => sum + a.points, 0);
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const completionPercentage = (unlockedCount / achievements.length) * 100;

  return (
    <motion.div
      className="container mx-auto p-4 max-w-7xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <Box className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="text-yellow-500" size={32} />
          <Typography variant="h4" component="h1">
            Achievements
          </Typography>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <Typography variant="subtitle2" color="textSecondary">
              Total Points
            </Typography>
            <Typography variant="h4">
              {totalPoints.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              of {totalPossiblePoints.toLocaleString()} possible points
            </Typography>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <Typography variant="subtitle2" color="textSecondary">
              Achievements Unlocked
            </Typography>
            <Typography variant="h4">
              {unlockedCount}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              of {achievements.length} total achievements
            </Typography>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <Typography variant="subtitle2" color="textSecondary">
              Completion
            </Typography>
            <Typography variant="h4">
              {completionPercentage.toFixed(1)}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={completionPercentage}
              className="mt-2"
            />
          </div>
        </div>
      </Box>

      {/* Category Tabs */}
      <Tabs
        value={category}
        onChange={(_, newValue) => setCategory(newValue)}
        className="mb-6"
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="All" value="all" />
        {ACHIEVEMENT_CATEGORIES.map(cat => (
          <Tab
            key={cat.id}
            label={cat.label}
            value={cat.id}
            icon={<cat.icon size={16} />}
            iconPosition="start"
          />
        ))}
      </Tabs>

      {/* Achievement List */}
      <AchievementList
        achievements={achievements}
        category={category === 'all' ? undefined : category}
      />
    </motion.div>
  );
} 