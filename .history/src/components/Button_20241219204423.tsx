import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
}

const StyledButton = styled(MuiButton, {
  shouldForwardProp: (prop) => prop !== 'variant' && prop !== 'size',
})<ButtonProps>(({ theme, variant = 'primary', size = 'md' }) => ({
  textTransform: 'none',
  fontWeight: 500,
  borderRadius: theme.shape.borderRadius * 2,
  ...(variant === 'primary' && {
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  }),
  ...(variant === 'secondary' && {
    backgroundColor: theme.palette.secondary.main,
    color: 'white',
    '&:hover': {
      backgroundColor: theme.palette.secondary.dark,
    },
  }),
  ...(variant === 'outline' && {
    backgroundColor: 'transparent',
    border: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  }),
  ...(variant === 'ghost' && {
    backgroundColor: 'transparent',
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  }),
  ...(size === 'sm' && {
    padding: theme.spacing(0.5, 1.5),
    fontSize: '0.875rem',
  }),
  ...(size === 'md' && {
    padding: theme.spacing(1, 2),
    fontSize: '1rem',
  }),
  ...(size === 'lg' && {
    padding: theme.spacing(1.5, 3),
    fontSize: '1.125rem',
  }),
}));

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  ...props
}: ButtonProps) {
  const sizeMap = {
    sm: 'small',
    md: 'medium',
    lg: 'large'
  } as const;

  return (
    <StyledButton
      variant={variant === 'outline' || variant === 'ghost' ? 'text' : 'contained'}
      size={size ? sizeMap[size] : undefined}
      className={className}
      startIcon={icon}
      {...props}
    >
      {children}
    </StyledButton>
  );
}

export default Button;

/**
 * Button Component
 * 
 * Purpose:
 * - Provides consistent button styling across the application
 * - Supports multiple variants and sizes
 * - Integrates with Material-UI theme
 * 
 * Props:
 * - variant: 'primary' | 'secondary' | 'outline' | 'ghost'
 * - size: 'sm' | 'md' | 'lg'
 * - icon: Optional icon component
 * - className: Additional CSS classes
 * 
 * Features:
 * - Custom styling based on variant
 * - Responsive sizing
 * - Icon support
 * - Theme integration
 * 
 * Used By:
 * - Multiple components across the application
 * 
 * Dependencies:
 * - Material-UI components
 * - Material-UI styling
 */