import React from 'react';
import { motion } from 'framer-motion';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  variant?: 'default' | 'gradient';
}

export function PageContainer({ 
  children, 
  className = '',
  noPadding = false,
  variant = 'default'
}: PageContainerProps) {
  const baseClasses = 'min-h-screen bg-app-background';
  const paddingClasses = noPadding ? '' : 'pt-32 pb-28';
  const variantClasses = variant === 'gradient' 
    ? 'bg-gradient-to-br from-app-gradient-dark-start to-app-gradient-dark-end' 
    : '';
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`${baseClasses} ${paddingClasses} ${variantClasses} ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </motion.div>
  );
} 