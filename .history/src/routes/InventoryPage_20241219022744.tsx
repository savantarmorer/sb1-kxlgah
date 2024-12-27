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
        
        // Load regular inventory items
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('user_inventory')
          .select(`
            *,
            item:items(*)
          `)
          .eq('user_id', state.user.id);

        if (inventoryError) throw inventoryError;

        // Load pending lootboxes
        const { data: lootboxData, error: lootboxError } = await supabase
          .from('pending_lootboxes')
          .select('*')
          .eq('user_id', state.user.id)
          .eq('is_claimed', false);

        if (lootboxError) throw lootboxError;

        const transformedInventory = inventoryData.map(record => ({
          ...record.item,
          quantity: record.quantity,
          equipped: record.equipped,
          acquired_at: record.acquired_at
        }));

        const transformedLootboxes = lootboxData.map(lootbox => ({
          id: lootbox.id,
          type: 'lootbox',
          rarity: lootbox.rarity,
          rewards: lootbox.rewards,
          name: `${lootbox.rarity.charAt(0).toUpperCase() + lootbox.rarity.slice(1)} Lootbox`,
          description: `A mysterious ${lootbox.rarity} lootbox containing valuable rewards`,
          value: 0,
          amount: 1,
          is_claimed: lootbox.is_claimed,
          created_at: lootbox.created_at
        }));

        dispatch({
          type: 'UPDATE_USER_PROFILE',
          payload: {
            inventory: [...transformedInventory, ...transformedLootboxes],
            backpack: transformedInventory.filter(item => item.equipped),
            pending_lootboxes: transformedLootboxes
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