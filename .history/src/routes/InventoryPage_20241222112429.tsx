import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import InventorySystem from '../components/inventory/InventorySystem';
import { useGame } from '../contexts/GameContext';

export function InventoryPage() {
  const navigate = useNavigate();
  const { state } = useGame();

  useEffect(() => {
    if (!state.user) {
      navigate('/login');
    }
  }, [state.user, navigate]);

  const handleViewChange = (view: string) => {
    navigate(view);
  };

  return (
    <Box sx={{ p: 3 }}>
      <InventorySystem
        onViewChange={handleViewChange}
      />
    </Box>
  );
} 