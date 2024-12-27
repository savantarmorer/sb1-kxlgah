import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Button, LinearProgress, CircularProgress } from '@mui/material';
import { useAchievements } from '../../hooks/useAchievements';
import { AchievementList } from './AchievementList';
import { Trophy, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import AdminDashboard from '../admin/AdminDashboard';

export function AchievementsPage() {
  const { achievements, initializeAchievements } = useAchievements();
  const { user, isAdmin: authIsAdmin } = useAuth();
  const { isAdmin: adminContextIsAdmin } = useAdmin();
  const [showAdminDashboard, setShowAdminDashboard] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Combine both admin checks
  const isAdmin = authIsAdmin || adminContextIsAdmin;

  // Initialize achievements on mount
  React.useEffect(() => {
    const loadAchievements = async () => {
      try {
        await initializeAchievements();
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && !achievements.length) {
      setIsLoading(true);
      loadAchievements();
    } else {
      setIsLoading(false);
    }
  }, [user, achievements.length, initializeAchievements]);

  // Debug logging for achievements
  React.useEffect(() => {
    console.log('Achievements Debug:', {
      achievementsCount: achievements.length,
      isLoading,
      userId: user?.id,
      hasUser: !!user
    });
  }, [achievements.length, isLoading, user]);

  // Enhanced debug logging
  React.useEffect(() => {
    console.log('Admin Status Debug:', {
      authContextAdmin: authIsAdmin,
      adminContextAdmin: adminContextIsAdmin,
      combinedAdmin: isAdmin,
      user: {
        id: user?.id,
        roles: user?.roles,
        is_super_admin: user?.is_super_admin
      }
    });
  }, [authIsAdmin, adminContextIsAdmin, isAdmin, user]);

  const totalPoints = achievements.reduce((sum, a) => sum + (a.unlocked ? a.points : 0), 0);
  const totalPossiblePoints = achievements.reduce((sum, a) => sum + a.points, 0);
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const completionPercentage = (unlockedCount / achievements.length) * 100;

  if (showAdminDashboard) {
    return <AdminDashboard />;
  }

  return (
    <motion.div
      className="container mx-auto p-4 max-w-7xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <Box className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="text-yellow-500" size={32} />
            <Typography variant="h4" component="h1">
              Achievements
            </Typography>
          </div>
          {/* Admin button with debug info */}
          <div className="flex items-center gap-2">
            {(isAdmin || process.env.NODE_ENV === 'development') && (
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<Settings size={20} />}
                onClick={() => {
                  console.log('Admin button clicked', { isAdmin, authIsAdmin, adminContextIsAdmin });
                  setShowAdminDashboard(true);
                }}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  padding: '8px 16px',
                  fontWeight: 'bold',
                }}
              >
                Admin Dashboard
                {!isAdmin && process.env.NODE_ENV === 'development' && ' (Dev Mode)'}
              </Button>
            )}
          </div>
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
            <Box sx={{ width: '100%', mt: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={completionPercentage} 
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'primary.main',
                  }
                }}
              />
            </Box>
          </div>
        </div>

        {/* Achievement List */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <AchievementList achievements={achievements} />
        )}
      </Box>
    </motion.div>
  );
} 