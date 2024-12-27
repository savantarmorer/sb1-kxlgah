// src/components/admin/Statistics.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import { supabase } from '../../lib/supabase.ts';
import { useNotification } from '../../contexts/NotificationContext';

interface SystemStats {
  activeUsers: number;
  completedQuests: number;
  battlesPlayed: number;
  averageScore: number;
  lastUpdated: string;
}

interface StatCardProps {
  label: string;
  value: number;
  helpText: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, helpText }) => (
  <Paper
    sx={{
      p: 4,
      bgcolor: 'background.paper',
      boxShadow: 1,
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
    }}
  >
    <Typography color="text.secondary" variant="subtitle2" gutterBottom>
      {label}
    </Typography>
    <Typography variant="h4" component="div" gutterBottom>
      {value}
    </Typography>
    <Typography color="text.secondary" variant="body2">
      {helpText}
    </Typography>
  </Paper>
);

export const Statistics: React.FC = () => {
  const [stats, setStats] = useState<SystemStats>({
    activeUsers: 0,
    completedQuests: 0,
    battlesPlayed: 0,
    averageScore: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);
  const { showError } = useNotification();

  const loadStatistics = async () => {
    setLoading(true);
    try {
      // Get active users count
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Get completed quests count
      const { count: completedQuests } = await supabase
        .from('user_quests')
        .select('*', { count: 'exact' })
        .eq('status', 'completed');

      // Get battles statistics
      const { data: battles } = await supabase
        .from('battle_history')
        .select('score_player');

      const battlesPlayed = battles?.length || 0;
      const averageScore = battles?.reduce((sum, battle) => sum + (battle.score_player || 0), 0) / (battlesPlayed || 1);

      setStats({
        activeUsers: activeUsers || 0,
        completedQuests: completedQuests || 0,
        battlesPlayed,
        averageScore: Math.round(averageScore * 100) / 100,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
      showError('Error loading statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
    const interval = setInterval(loadStatistics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        System Statistics
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Active Users"
            value={stats.activeUsers}
            helpText="Total registered users"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Completed Quests"
            value={stats.completedQuests}
            helpText="Total quest completions"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Battles Played"
            value={stats.battlesPlayed}
            helpText="Total battles"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Average Score"
            value={stats.averageScore}
            helpText="Per battle"
          />
        </Grid>
      </Grid>
    </Box>
  );
};