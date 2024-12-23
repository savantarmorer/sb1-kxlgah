import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import InventorySystem from '../components/inventory/InventorySystem';
import Navigation from '../components/Navigation';
import type { View } from '../types/navigation';
import { useGame } from '../contexts/GameContext';
import { supabase } from '../lib/supabase.ts';
import { Crown, Package } from 'lucide-react';
import { useTitles } from '../hooks/useTitles';
import { TabPanel } from '../components/TabPanel';
import { Button } from '@mui/material';

export function InventoryPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { userTitles, equipTitle, unequipTitle } = useTitles();

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
          .eq('user_id', state.user?.id);

        if (inventoryError) throw inventoryError;

        // Load pending lootboxes
        const { data: lootboxData, error: lootboxError } = await supabase
          .from('pending_lootboxes')
          .select('*')
          .eq('user_id', state.user?.id)
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
          type: 'lootbox' as const,
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
          type: 'UPDATE_INVENTORY',
          payload: {
            items: [...transformedInventory, ...transformedLootboxes]
          }
        });
      } catch (error) {
        console.error('Error loading inventory:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadInventory();
  }, [dispatch, state.user?.id]);

  const handleViewChange = (view: View) => {
    navigate(view);
  };

  const handleEquipTitle = async (titleId: string) => {
    try {
      await equipTitle(titleId);
    } catch (error) {
      console.error('Error equipping title:', error);
    }
  };

  const tabs = [
    { value: 'items', label: 'Items', icon: <Package /> },
    { value: 'titles', label: 'Titles', icon: <Crown /> },
    // ... other existing tabs
  ];

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
      <TabPanel value="titles">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userTitles.map((title) => (
            <div
              key={title.id}
              className={`p-4 rounded-lg ${
                title.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-300 to-amber-500' :
                title.rarity === 'epic' ? 'bg-gradient-to-r from-purple-400 to-pink-500' :
                title.rarity === 'rare' ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                'bg-gradient-to-r from-gray-400 to-slate-500'
              } transform transition-all duration-300 hover:scale-105`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{title.name}</h3>
                  <p className="text-sm text-white/80">{title.description}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold 
                  ${title.rarity === 'legendary' ? 'bg-yellow-300 text-yellow-900' :
                    title.rarity === 'epic' ? 'bg-purple-300 text-purple-900' :
                    title.rarity === 'rare' ? 'bg-blue-300 text-blue-900' :
                    'bg-gray-300 text-gray-900'}`}
                >
                  {title.rarity.toUpperCase()}
                </span>
              </div>
              
              {title.requirements?.level > 0 && (
                <p className="text-white/70 text-xs mb-4">
                  Required Level: {title.requirements.level}
                </p>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={() => handleEquipTitle(title.id)}
                  variant={title.is_equipped ? 'secondary' : 'primary'}
                  disabled={title.is_equipped}
                >
                  {title.is_equipped ? 'Equipped' : 'Equip'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </TabPanel>
    </Box>
  );
} 