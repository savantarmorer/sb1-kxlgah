import React from 'react';
import { CircularProgress } from '@mui/material';

interface LoaderProps {
  size?: number;
  className?: string;
}

export function Loader({ size = 24, className = '' }: LoaderProps) {
  return (
    <CircularProgress 
      size={size} 
      className={className}
    />
  );
} 