import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../contexts/AdminContext';
import { Achievement } from '../../types/achievements';
import { AchievementService } from '../../services/achievementService';
import { AchievementCard } from './AchievementCard';
import AdminDashboard from '../admin/AdminDashboard';
import { Box, Grid } from '@mui/material';

export function AchievementsPage() {
  const { user } = useAuth();
  const { isAdmin: adminContextIsAdmin } = useAdmin();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  const loadAchievements = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const userAchievements = await AchievementService.getUserAchievements(user.id);
      setAchievements(userAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  // Calculate statistics
  const totalPoints = achievements.reduce((sum, a) => sum + (a.unlocked ? a.points : 0), 0);
  const totalPossiblePoints = achievements.reduce((sum, a) => sum + a.points, 0);
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const completionPercentage = (unlockedCount / achievements.length) * 100;

  const handleAchievementClaimed = async (achievementId: string) => {
    // Refresh achievements list after claiming
    await loadAchievements();
  };

  if (showAdminDashboard) {
    return <AdminDashboard />;
  }

  if (!user?.id) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto p-8 text-center"
      >
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
          Please log in to view achievements
        </h2>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="container mx-auto p-4 max-w-7xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="text-yellow-500" size={32} />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Achievements
            </h1>
          </div>
          {/* Admin button with debug info */}
          {(adminContextIsAdmin || process.env.NODE_ENV === 'development') && (
            <button
              onClick={() => {
                console.log('Admin button clicked', { adminContextIsAdmin });
                setShowAdminDashboard(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors shadow-sm"
            >
              <Settings size={20} />
              <span className="font-medium">
                Admin Dashboard
                {!adminContextIsAdmin && process.env.NODE_ENV === 'development' && ' (Dev Mode)'}
              </span>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Points
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {totalPoints.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              of {totalPossiblePoints.toLocaleString()} possible points
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Achievements Unlocked
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {unlockedCount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              of {achievements.length} total achievements
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Completion
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {completionPercentage.toFixed(1)}%
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Achievement List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
          </div>
        ) : (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2}>
              {achievements.map((achievement) => (
                <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                  <AchievementCard
                    achievement={achievement}
                    onAchievementClaimed={handleAchievementClaimed}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </div>
    </motion.div>
  );
} 