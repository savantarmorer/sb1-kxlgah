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
  const isLowTime = time_left <= 5;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden"
    >
      <motion.div
        initial={{ width: '100%' }}
        animate={{ 
          width: `${progress}%`,
          backgroundColor: isLowTime ? '#ef4444' : '#3b82f6'
        }}
        transition={{ duration: 0.3 }}
        className="absolute inset-y-0 left-0 rounded-full"
      />

      {isLowTime && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 bg-red-500/20"
        />
      )}
    </motion.div>
  );
}
