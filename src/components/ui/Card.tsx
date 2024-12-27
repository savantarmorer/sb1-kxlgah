import { motion } from 'framer-motion';
import { theme } from '../../styles/design-system';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export function Card({ children, className = '', animate = true }: CardProps) {
  const Component = animate ? motion.div : 'div';
  
  return (
    <Component
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={theme.animation.transition}
      className={`bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm 
                 border border-gray-200 dark:border-gray-800 
                 backdrop-blur-sm ${className}`}
    >
      {children}
    </Component>
  );
} 