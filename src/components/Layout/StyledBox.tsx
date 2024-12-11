import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface StyledBoxProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: 'default' | 'gradient' | 'glass';
  hover?: boolean;
  className?: string;
}

export function StyledBox({ 
  children, 
  variant = 'default',
  hover = true,
  className = '',
  ...motionProps
}: StyledBoxProps) {
  const baseClasses = 'card';
  const variantClasses = {
    default: '',
    gradient: 'card-gradient',
    glass: 'card-glass'
  };
  const hoverClasses = hover ? 'card-hover' : '';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      {...motionProps}
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}
    >
      {children}
    </motion.div>
  );
} 