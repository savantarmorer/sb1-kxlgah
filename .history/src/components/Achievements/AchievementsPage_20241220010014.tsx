import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, Tab, Box, Typography, LinearProgress, Button } from '@mui/material';
import { useAchievements } from '../../hooks/useAchievements';
import { AchievementList } from './AchievementList';
import { ACHIEVEMENT_CATEGORIES } from '../../constants/achievements';
import { Trophy, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import AdminDashboard from '../admin/AdminDashboard';

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

        {/* Rest of the component remains the same */}
        // ... existing code ...
      </Box>
    </motion.div>
  );
} 