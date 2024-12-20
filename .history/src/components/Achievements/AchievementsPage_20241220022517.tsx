import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Button, LinearProgress, CircularProgress } from '@mui/material';
import { useAchievements } from '../../hooks/useAchievements';
import { AchievementList } from './AchievementList';
import { Trophy, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import AdminDashboard from '../admin/AdminDashboard';
import { AchievementService } from '../../services/AchievementService';

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

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading>Achievements</Heading>
        
        {isLoading ? (
          <Center p={8}>
            <Spinner size="xl" />
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                userId={user?.id}
                onUpdate={loadAchievements}
              />
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  );
} 