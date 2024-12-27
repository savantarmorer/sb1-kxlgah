import React from 'react';
import { motion } from 'framer-motion';
import { Loader as LoaderIcon } from 'lucide-react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function Loader({ size = 'md', color = 'primary', className = '' }: LoaderProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorMap = {
    primary: 'text-indigo-600 dark:text-indigo-400',
    secondary: 'text-gray-600 dark:text-gray-400',
    white: 'text-white'
  };

  return (
    <motion.div
      animate={{ 
        rotate: 360,
        transition: {
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }
      }}
      className={`${sizeMap[size]} ${colorMap[color as keyof typeof colorMap] || color} ${className}`}
    >
      <LoaderIcon className="w-full h-full" />
    </motion.div>
  );
} 