import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, Tab, Box, Typography, LinearProgress, Button } from '@mui/material';
import { useAchievements } from '../hooks/useAchievements';
import { AchievementList } from '../components/Achievements/AchievementList';
import { ACHIEVEMENT_CATEGORIES } from '../constants/achievements';
import { Trophy, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import AdminDashboard from '../components/admin/AdminDashboard';

export function AchievementsPage() {
  const { achievements } = useAchievements();
  const [category, setCategory] = React.useState<string>('all');
  const { user, isAdmin: authIsAdmin } = useAuth();
  const { isAdmin: adminContextIsAdmin } = useAdmin();
  const [showAdminDashboard, setShowAdminDashboard] = React.useState(false);

  // Combine both admin checks
  const isAdmin = authIsAdmin || adminContextIsAdmin;

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