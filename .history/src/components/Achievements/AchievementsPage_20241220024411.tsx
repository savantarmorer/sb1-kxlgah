import React, { useCallback, useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Grid,
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { Achievement } from '../../types/achievements';
import { AchievementService } from '../../services/achievementService';
import { AchievementCard } from './AchievementCard';

export function AchievementsPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  if (!user?.id) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center">
          <Typography variant="h5">Please log in to view achievements</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Typography variant="h4">Achievements</Typography>
        
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress size={48} />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {achievements.map((achievement) => (
              <Grid item xs={12} md={6} lg={4} key={achievement.id}>
                <AchievementCard
                  achievement={achievement}
                  userId={user.id}
                  onUpdate={loadAchievements}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
} 