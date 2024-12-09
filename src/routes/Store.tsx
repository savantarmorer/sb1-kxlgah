import React from 'react';
import { Store as StoreComponent } from '../components/Store/Store';
import { Box } from '@mui/material';
import { Navigation } from '../components/Navigation';

export function Store() {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      <Box sx={{ flex: 1 }}>
        <StoreComponent />
      </Box>
      <Navigation />
    </Box>
  );
} 