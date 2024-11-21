import React from 'react';
import { motion } from 'framer-motion';
import { Timer as TimerIcon } from 'lucide-react';

interface TimerProps {
  timeLeft: number;
  totalTime: number;
}

export default function Timer({ timeLeft, totalTime }: TimerProps) {
  const progress = (timeLeft / totalTime) * 100;
  const isLow = timeLeft <= 5;

  return (
    <div className="relative">
      <motion.div
        animate={isLow ? {
          scale: [1, 1.1, 1],
          transition: {
            duration: 0.5,
            repeat: Infinity
          }
        } : {}}
        className={`flex items-center space-x-2 ${
          isLow ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        <TimerIcon className="w-5 h-5" />
        <span className="font-medium">{timeLeft}s</span>
      </motion.div>
      
      <motion.div
        className="absolute -bottom-2 left-0 h-1 bg-brand-teal-500 dark:bg-brand-teal-400 rounded-full"
        initial={{ width: '100%' }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1, ease: "linear" }}
        style={{
          backgroundColor: isLow ? '#EF4444' : undefined
        }}
      />
    </div>
  );
} 

