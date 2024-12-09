import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Avatar, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { Trophy, Star, Target, Award, Zap, Crown } from 'lucide-react';
import { use_game } from '../../contexts/GameContext';
import Navigation from '../Navigation';
import { useNavigate, useLocation } from 'react-router-dom';
import { View } from '../../types/navigation';

const statCards = [
  { title: 'Level', icon: Star, color: '#ff9800' },
  { title: 'XP', icon: Zap, color: '#2196f3' },
  { title: 'Wins', icon: Trophy, color: '#4caf50' },
  { title: 'Streak', icon: Target, color: '#9c27b0' }
];

const achievements = [
  { title: 'First Victory', icon: Trophy, description: 'Win your first battle', progress: 100 },
  { title: 'Knowledge Seeker', icon: Star, description: 'Answer 100 questions', progress: 75 },
  { title: 'Perfect Streak', icon: Target, description: 'Maintain a 5-win streak', progress: 60 },
  { title: 'Master', icon: Crown, description: 'Reach level 10', progress: 40 }
];

export default function ProfileDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = use_game();

  const handleViewChange = (view: View) => {
    navigate(view);
  };

  const getCurrentView = (): View => {
    return '/profile' as View;
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      <Box sx={{ flex: 1, p: 3 }}>
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 3,
            mb: 4
          }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Avatar
                src={state.user.avatar_url}
                sx={{ 
                  width: 80, 
                  height: 80,
                  border: '4px solid',
                  borderColor: 'primary.main'
                }}
              />
            </motion.div>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {state.user.username}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                  size="small"
                  icon={<Crown size={14} />}
                  label={`Level ${state.user.level}`}
                  color="primary"
                />
                <Chip
                  size="small"
                  icon={<Trophy size={14} />}
                  label={`${state.battle_stats?.wins || 0} Wins`}
                  color="success"
                />
              </Box>
            </Box>
          </Box>
        </motion.div>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            let value = 0;
            
            switch (stat.title) {
              case 'Level':
                value = state.user.level;
                break;
              case 'XP':
                value = state.user.xp;
                break;
              case 'Wins':
                value = state.battle_stats?.wins || 0;
                break;
              case 'Streak':
                value = state.battle_stats?.win_streak || 0;
                break;
            }

            return (
              <Grid item xs={6} sm={3} key={stat.title}>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Card sx={{ 
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 3,
                    height: '100%'
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Icon size={20} color={stat.color} />
                        <Typography color="textSecondary">
                          {stat.title}
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {value.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>

        {/* Achievements */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
            Achievements
          </Typography>
          <Grid container spacing={3}>
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <Grid item xs={12} sm={6} key={achievement.title}>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card sx={{ 
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      boxShadow: 3
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ 
                            p: 1.5,
                            borderRadius: '50%',
                            bgcolor: 'primary.light',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Icon size={24} className="text-white" />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {achievement.title}
                            </Typography>
                            <Typography color="textSecondary" variant="body2">
                              {achievement.description}
                            </Typography>
                          </Box>
                          <Box sx={{ 
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            border: '3px solid',
                            borderColor: achievement.progress === 100 ? 'success.main' : 'divider',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {achievement.progress}%
                            </Typography>
                            {achievement.progress === 100 && (
                              <Award 
                                size={16} 
                                className="text-green-500 absolute -top-2 -right-2"
                              />
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Box>
      <Navigation 
        currentView={getCurrentView()}
        onViewChange={handleViewChange}
      />
    </Box>
  );
}