import React, { useEffect } from 'react';
import { Box, Tab, Tabs, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import InventorySystem from '../components/inventory/InventorySystem';
import Navigation from '../components/Navigation';
import type { View } from '../types/navigation';
import { useGame } from '../contexts/GameContext';
import { supabase } from '../lib/supabase.ts';
import { Crown, Package } from 'lucide-react';
import { useTitles } from '../hooks/useTitles';
import { DisplayTitle } from '../types/titles';

export function InventoryPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { userTitles, equipTitle, unequipTitle } = useTitles();
  const [currentTab, setCurrentTab] = React.useState('items');

  useEffect(() => {
    if (!state.user) {
      navigate('/login');
    }
  }, [state.user, navigate]);

  const handleViewChange = (view: string) => {
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
    { value: 'items', label: 'Items', icon: <Package className="w-5 h-5" /> },
    { value: 'titles', label: 'Titles', icon: <Crown className="w-5 h-5" /> }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <InventorySystem
        inventory={state.inventory}
        onViewChange={handleViewChange}
      />
      <Box sx={{ width: '100%', mt: 4 }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={
                <div className="flex items-center gap-2">
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>
              }
            />
          ))}
        </Tabs>

        {currentTab === 'titles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {userTitles.map((userTitle) => {
              const title = userTitle.title as DisplayTitle;
              return (
                <div
                  key={userTitle.id}
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
                      onClick={() => handleEquipTitle(userTitle.id)}
                      variant={userTitle.is_equipped ? 'contained' : 'outlined'}
                      disabled={userTitle.is_equipped}
                      sx={{ color: 'white', borderColor: 'white' }}
                    >
                      {userTitle.is_equipped ? 'Equipped' : 'Equip'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentTab === 'items' && (
          <div className="mt-4">
            {/* Existing items content */}
          </div>
        )}
      </Box>
    </Box>
  );
} 