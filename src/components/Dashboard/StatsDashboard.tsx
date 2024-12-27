import React from 'react';
import { useGame } from '../../contexts/GameContext';
import { Box, Grid, Paper, Typography } from '@mui/material';

export default function StatsDashboard() {
  const { state } = useGame();
  const { statistics } = state;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Battle Stats</Typography>
          <Box>
            <Typography>Battles Won: {statistics.battles_won}</Typography>
            <Typography>Battles Lost: {statistics.battles_lost}</Typography>
            <Typography>Current Streak: {statistics.current_streak}</Typography>
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Progress</Typography>
          <Box>
            <Typography>Total XP: {statistics.total_xp}</Typography>
            <Typography>Total Coins: {statistics.total_coins}</Typography>
            <Typography>Quests Completed: {statistics.quests_completed}</Typography>
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Achievements</Typography>
          <Box>
            <Typography>Unlocked: {statistics.achievements_unlocked}</Typography>
            <Typography>Highest Streak: {statistics.highest_streak}</Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
} 