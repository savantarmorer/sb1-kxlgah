import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Tab, Tabs } from '@mui/material';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase.ts';
import { useNotification } from '../../contexts/NotificationContext';
import { useGame } from '../../contexts/GameContext';
import { Package, Shield, Zap, Crown, Star, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { View } from '../../types/navigation';
import Button from '../Button';
import { InventoryItem, ItemType } from '../../types/items';
import { ItemCard } from './ItemCard';
import { InventoryGrid } from './InventoryGrid';
import { FilterDrawer } from './FilterDrawer';
import { ItemDetails } from './ItemDetails';
import { useTitles } from '../../hooks/useTitles';
import { DisplayTitle } from '../../types/titles';

const itemTypeIcons = {
  [ItemType.BOOSTER]: Sparkles,
  [ItemType.CONSUMABLE]: Zap,
  [ItemType.EQUIPMENT]: Shield,
  [ItemType.COSMETIC]: Crown,
  [ItemType.MATERIAL]: Star,
  default: Package
};

const categories = [
  { type: ItemType.BOOSTER, label: 'Boosters' },
  { type: ItemType.CONSUMABLE, label: 'Consumables' },
  { type: ItemType.EQUIPMENT, label: 'Equipment' },
  { type: ItemType.COSMETIC, label: 'Cosmetics' },
  { type: ItemType.MATERIAL, label: 'Materials' }
];

interface InventorySystemProps {
  onViewChange?: (view: string) => void;
}

export default function InventorySystem({ onViewChange }: InventorySystemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<ItemType | null>(null);
  const { showSuccess, showError } = useNotification();
  const { state, dispatch } = useGame();
  const [loading, setLoading] = useState(true);
  const [userItems, setUserItems] = useState<InventoryItem[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [rarityFilter, setRarityFilter] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [currentTab, setCurrentTab] = React.useState('items');
  const { userTitles, equipTitle, unequipTitle } = useTitles();

  useEffect(() => {
    if (!state.user) {
      navigate('/login');
      return;
    }
    loadUserInventory();
  }, []);

  const loadUserInventory = async () => {
    if (!state.user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_inventory')
        .select(`
          *,
          item:items (
            id,
            name,
            description,
            type,
            rarity,
            effects,
            metadata,
            icon,
            icon_color
          )
        `)
        .eq('user_id', state.user.id);

      if (error) throw error;

      const transformedItems = data?.map(record => ({
        id: record.item.id,
        name: record.item.name,
        description: record.item.description,
        type: record.item.type,
        rarity: record.item.rarity,
        equipped: record.equipped,
        quantity: record.quantity,
        effects: record.item.effects,
        metadata: record.item.metadata,
        icon: record.item.icon,
        icon_color: record.item.icon_color,
        imageUrl: record.item.icon || `/images/items/${record.item.type.toLowerCase()}.png`,
        acquired_at: record.acquired_at
      })) || [];

      // Filter out items that are titles (they will be shown in the titles tab)
      const nonTitleItems = transformedItems.filter(item => !item.metadata?.isTitle);
      setUserItems(nonTitleItems);
    } catch (error) {
      console.error('Error loading inventory:', error);
      showError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleEquipTitle = async (titleId: string) => {
    try {
      await equipTitle(titleId);
      showSuccess('Title equipped successfully');
    } catch (error) {
      console.error('Error equipping title:', error);
      showError('Failed to equip title');
    }
  };

  const handleEquip = async (item: InventoryItem) => {
    if (!state.user) {
      showError('User not logged in');
      return;
    }

    try {
      // If the item is a title, handle it differently
      if (item.metadata?.isTitle) {
        await equipTitle(item.id);
        showSuccess('Title equipped successfully!');
        return;
      }

      // For regular items
      const { error } = await supabase
        .from('user_inventory')
        .update({ equipped: true })
        .eq('user_id', state.user.id)
        .eq('item_id', item.id);

      if (error) throw error;

      // Update local state
      const updatedItems = userItems.map(i => 
        i.id === item.id ? { ...i, equipped: true } : i
      );
      setUserItems(updatedItems);
      
      // Update game state
      dispatch({
        type: 'UPDATE_INVENTORY',
        payload: {
          items: updatedItems,
          equipped: [...state.inventory.equipped, item.id]
        }
      });

      showSuccess('Item equipped!');
    } catch (error: any) {
      showError(error.message || 'Failed to equip item');
    }
  };

  const handleUnequip = async (item: InventoryItem) => {
    if (!state.user) {
      showError('User not logged in');
      return;
    }

    try {
      // If the item is a title, handle it differently
      if (item.metadata?.isTitle) {
        await unequipTitle(item.id);
        showSuccess('Title unequipped successfully!');
        return;
      }

      // For regular items
      const { error } = await supabase
        .from('user_inventory')
        .update({ equipped: false })
        .eq('user_id', state.user.id)
        .eq('item_id', item.id);

      if (error) throw error;

      // Update local state
      const updatedItems = userItems.map(i => 
        i.id === item.id ? { ...i, equipped: false } : i
      );
      setUserItems(updatedItems);
      
      // Update game state
      dispatch({
        type: 'UPDATE_INVENTORY',
        payload: {
          items: updatedItems,
          equipped: state.inventory.equipped.filter(id => id !== item.id)
        }
      });

      showSuccess('Item unequipped!');
    } catch (error: any) {
      showError(error.message || 'Failed to unequip item');
    }
  };

  const handleUse = async (item: InventoryItem) => {
    // TODO: Implement item usage logic
    console.log('Using item:', item);
  };

  const handleItemSelect = (item: InventoryItem) => {
    setSelectedItem(item);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
          Loading inventory...
        </Typography>
      </Box>
    );
  }

  const filteredItems = userItems
    .filter(item => !selectedCategory || item.type === selectedCategory)
    .filter(item => !rarityFilter.length || rarityFilter.includes(item.rarity.toLowerCase()));

  const tabs = [
    { value: 'items', label: 'Items', icon: <Package className="w-5 h-5" /> },
    { value: 'titles', label: 'Titles', icon: <Crown className="w-5 h-5" /> }
  ];

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      bgcolor: 'background.default',
      p: 3
    }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {currentTab === 'items' ? 'Inventory' : 'Titles'}
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1,
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            {currentTab === 'items' ? (
              <>
                <Package size={24} className="text-indigo-500" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {filteredItems.length} Items
                </Typography>
              </>
            ) : (
              <>
                <Crown size={24} className="text-indigo-500" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {userTitles.length} Titles
                </Typography>
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ width: '100%', mb: 4 }}>
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
      </Box>

      {currentTab === 'items' && (
        <>
          {/* Category Filter */}
          <Box sx={{ mb: 4, display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Chip
                icon={<Package size={16} />}
                label="All Items"
                onClick={() => setSelectedCategory(null)}
                sx={{
                  bgcolor: !selectedCategory ? 'primary.main' : 'background.paper',
                  color: !selectedCategory ? 'white' : 'text.primary',
                  fontWeight: 'bold',
                  '&:hover': {
                    bgcolor: !selectedCategory ? 'primary.dark' : 'action.hover'
                  }
                }}
              />
            </motion.div>
            {categories.map(({ type, label }) => {
              const Icon = itemTypeIcons[type] || itemTypeIcons.default;
              return (
                <motion.div key={type} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Chip
                    icon={<Icon size={16} />}
                    label={label}
                    onClick={() => setSelectedCategory(type)}
                    sx={{
                      bgcolor: selectedCategory === type ? 'primary.main' : 'background.paper',
                      color: selectedCategory === type ? 'white' : 'text.primary',
                      fontWeight: 'bold',
                      '&:hover': {
                        bgcolor: selectedCategory === type ? 'primary.dark' : 'action.hover'
                      }
                    }}
                  />
                </motion.div>
              );
            })}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Chip
                icon={<Package size={16} />}
                label="More Filters"
                onClick={() => setFilterDrawerOpen(true)}
                sx={{
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  fontWeight: 'bold',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              />
            </motion.div>
          </Box>

          {/* Items Grid */}
          <InventoryGrid items={filteredItems} onItemSelect={handleItemSelect} />

          {/* Filter Drawer */}
          <FilterDrawer
            open={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            rarityFilter={rarityFilter}
            onRarityFilterChange={setRarityFilter}
          />

          {/* Item Details Modal */}
          {selectedItem && (
            <ItemDetails
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onEquip={handleEquip}
              onUnequip={handleUnequip}
              onUse={handleUse}
            />
          )}
        </>
      )}

      {currentTab === 'titles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </Box>
  );
} 