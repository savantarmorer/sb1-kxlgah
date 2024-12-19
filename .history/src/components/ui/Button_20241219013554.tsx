import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  className,
  isLoading,
  size = 'md',
  variant = 'primary',
  fullWidth,
  icon,
  disabled,
  ...props
}: ButtonProps) {
  const { fullWidth: _, ...buttonProps } = props;

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        {
          'w-full': fullWidth,
          'px-4 py-2 text-sm': size === 'sm',
          'px-6 py-3 text-base': size === 'md',
          'px-8 py-4 text-lg': size === 'lg',
          'bg-primary text-white hover:bg-primary/90': variant === 'primary',
          'bg-secondary text-white hover:bg-secondary/90': variant === 'secondary',
          'border-2 border-primary text-primary hover:bg-primary/10': variant === 'outline',
          'opacity-50 cursor-not-allowed': disabled || isLoading
        },
        className
      )}
      disabled={disabled || isLoading}
      {...buttonProps}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {isLoading ? (
        <span className="mr-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </span>
      ) : null}
      {children}
    </button>
  );
} 