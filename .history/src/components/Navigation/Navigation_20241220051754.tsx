import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Badge, IconButton, useTheme } from '@mui/material';
import { Trophy, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AchievementService } from '../../services/achievementService';

export function Navigation() {
  const location = useLocation();
  const { user } = useAuth();
  const [hasUnclaimedAchievements, setHasUnclaimedAchievements] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const checkUnclaimedAchievements = async () => {
      if (!user?.id) return;
      try {
        const achievements = await AchievementService.getUserAchievements(user.id);
        const hasUnclaimed = achievements.some(a => a.ready_to_claim);
        setHasUnclaimedAchievements(hasUnclaimed);
      } catch (error) {
        console.error('Error checking unclaimed achievements:', error);
      }
    };

    checkUnclaimedAchievements();

    // Subscribe to achievement claim events
    const unsubscribe = AchievementService.subscribeToClaimEvents(() => {
      checkUnclaimedAchievements();
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        p: 2,
        bgcolor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
        zIndex: 1000,
      }}
    >
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Link to="/achievements">
          <IconButton
            color={location.pathname === '/achievements' ? 'primary' : 'default'}
            sx={{ position: 'relative' }}
          >
            <Badge
              variant="dot"
              color="error"
              invisible={!hasUnclaimedAchievements}
              sx={{
                '& .MuiBadge-badge': {
                  right: 4,
                  top: 4,
                }
              }}
            >
              <Trophy />
            </Badge>
          </IconButton>
        </Link>
        <Link to="/settings">
          <IconButton
            color={location.pathname === '/settings' ? 'primary' : 'default'}
          >
            <Settings />
          </IconButton>
        </Link>
      </Box>
    </Box>
  );
} 