import React from 'react';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Input({
  label,
  error,
  icon,
  fullWidth = false,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-app-text-secondary text-sm font-medium mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {React.cloneElement(icon as React.ReactElement, {
              className: 'w-5 h-5 text-app-text-muted'
            })}
          </div>
        )}
        
        <motion.input
          whileFocus={{ scale: 1.01 }}
          className={`
            input
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-app-error focus:border-app-error focus:ring-app-error/50' : ''}
            ${fullWidth ? 'w-full' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-app-error"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
} 