import React, { useCallback, useEffect, useState } from 'react';
import {
  Container,
  VStack,
  Heading,
  Center,
  Spinner,
  SimpleGrid,
} from '@chakra-ui/react';
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
      <Container maxW="container.xl" py={8}>
        <Center>
          <Heading size="md">Please log in to view achievements</Heading>
        </Center>
      </Container>
    );
  }

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
                userId={user.id}
                onUpdate={loadAchievements}
              />
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  );
} 