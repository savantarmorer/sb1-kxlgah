import React from 'react';
import { Box, Container } from '@mui/material';
import UserProgress from '../UserProgress';
import QuestSystem from '../QuestSystem';
import DailyRewardSystem from '../DailyRewards/DailyRewardSystem';
import { AchievementList } from '../Achievements/AchievementList';
import { useAchievements } from '../../hooks/useAchievements';
import { useGame } from '../../contexts/GameContext';
import LoadingScreen from '../LoadingScreen';

export default function Dashboard() {
  const { state } = useGame();

  if (!state.user) {
    return <LoadingScreen />;
  }

  const { achievements } = useAchievements();

  return (
    <Box sx={{ 
      height: '100vh',
      overflow: 'hidden',
      bgcolor: 'background.default'
    }}>
      <Container 
        maxWidth="lg" 
        sx={{ 
          height: '100%',
          overflow: 'auto',
          py: 3
        }}
      >
        <Box className="space-y-6">
          <Box sx={{ mb: 4 }}>
            <UserProgress showSettings showRecentGains showMultipliers />
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <QuestSystem />
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <DailyRewardSystem />
          </Box>
          
          <Box>
            <AchievementList 
              achievements={achievements} 
              showFilters={false} 
              maxDisplay={5} 
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
} 