import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import InventorySystem from '../components/inventory/InventorySystem';
import Navigation from '../components/Navigation';
import type { View } from '../types/navigation';
import { useGame } from '../contexts/GameContext';
import { supabase } from '../lib/supabase.ts';

export function InventoryPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();

  useEffect(() => {
    // Load inventory data on mount
    const loadInventory = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const { data: inventoryData, error } = await supabase
          .from('user_inventory')
          .select(`
            *,
            item:items(*)
          `)
          .eq('user_id', state.user.id);

        if (error) throw error;

        const transformedInventory = inventoryData.map(record => ({
          ...record.item,
          quantity: record.quantity,
          equipped: record.equipped,
          acquired_at: record.acquired_at
        }));

        dispatch({
          type: 'UPDATE_USER_PROFILE',
          payload: {
            inventory: transformedInventory,
            backpack: transformedInventory.filter(item => item.equipped)
          }
        });
      } catch (error) {
        console.error('Error loading inventory:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadInventory();
  }, [dispatch, state.user.id]);

  const handleViewChange = (view: View) => {
    navigate(view);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      <Box sx={{ flex: 1, p: 3 }}>
        <InventorySystem />
      </Box>
      <Navigation 
        currentView="/inventory"
        onViewChange={handleViewChange}
      />
    </Box>
  );
} 