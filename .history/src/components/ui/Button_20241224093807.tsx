import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';

interface ButtonProps extends MuiButtonProps {
  variant?: 'contained' | 'outlined' | 'text' | 'ghost';
}

export default function Button({ variant = 'contained', children, ...props }: ButtonProps) {
  const getVariantStyles = () => {
    if (variant === 'ghost') {
      return {
        backgroundColor: 'transparent',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)'
        }
      };
    }
    return {};
  };

  return (
    <MuiButton
      variant={variant === 'ghost' ? 'text' : variant}
      sx={{
        ...getVariantStyles(),
        ...props.sx
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
} 