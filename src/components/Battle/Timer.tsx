import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface TimerProps {
  time_left: number;
  total_time: number;
}

export default function Timer({ time_left, total_time }: TimerProps) {
  const progress = (time_left / total_time) * 100;
  const isLow = time_left <= 5;
  
  return (
    <Box sx={{ width: '100%' }}>
      <motion.div
        animate={isLow ? {
          scale: [1, 1.05, 1],
          transition: {
            duration: 0.5,
            repeat: Infinity
          }
        } : {}}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Clock 
            size={20} 
            className={isLow ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}
          />
          <Typography 
            variant="body1" 
            sx={{ 
              fontWeight: 'medium',
              color: isLow ? 'error.main' : 'text.secondary'
            }}
          >
            Time Remaining: {time_left}s
          </Typography>
        </Box>
      </motion.div>
      <LinearProgress 
        variant="determinate" 
        value={progress}
        sx={{ 
          height: 8, 
          borderRadius: 4,
          bgcolor: 'background.paper',
          '& .MuiLinearProgress-bar': {
            bgcolor: isLow ? 'error.main' : 'primary.main',
            borderRadius: 4,
            transition: 'width 0.3s ease'
          }
        }}
      />
    </Box>
  );
}
