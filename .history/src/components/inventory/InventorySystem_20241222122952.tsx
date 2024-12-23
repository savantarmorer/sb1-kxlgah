import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase.ts';
import { useNotification } from '../../contexts/NotificationContext';
import { useGame } from '../../contexts/GameContext';
import { Package, Shield, Zap, Crown, Star, Sparkles, type LucideIcon, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { View } from '../../types/navigation';
import Button from '../Button';
import { InventoryItem, ItemType } from '../../types/items';
import { ItemCard } from './ItemCard';
import { InventoryGrid } from './InventoryGrid';
import { FilterDrawer } from './FilterDrawer';
import { ItemDetails } from './ItemDetails';

const itemTypeIcons: Record<ItemType | 'default', LucideIcon> = {
  [ItemType.BOOSTER]: Sparkles,
  [ItemType.CONSUMABLE]: Zap,
  [ItemType.EQUIPMENT]: Shield,
  [ItemType.COSMETIC]: Crown,
  [ItemType.MATERIAL]: Star,
  [ItemType.QUEST]: Package,
  [ItemType.LOOTBOX]: Package,
  [ItemType.AVATAR]: User,
  default: Package
};

const categories = [
  { type: ItemType.BOOSTER, label: 'Boosters' },
  { type: ItemType.CONSUMABLE, label: 'Consumables' },
  { type: ItemType.EQUIPMENT, label: 'Equipment' },
  { type: ItemType.MATERIAL, label: 'Materials' }
];

interface DisplayTitleResponse {
  title_id: string;
  is_equipped: boolean;
  display_titles: DisplayTitle[];
}

interface DisplayTitle {
  id: string;
  name: string;
  description: string;
  rarity: string;
  metadata: any;
}

export default function InventorySystem() {
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
  const [showTitles, setShowTitles] = useState(false);
  const [showAvatars, setShowAvatars] = useState(false);
  const [userAvatars, setUserAvatars] = useState<any[]>([]);

  useEffect(() => {
    if (!state.user) {
      navigate('/login');
      return;
    }
    loadUserInventory();
    loadUserAvatars();
  }, []);

  const loadUserInventory = async () => {
    if (!state.user) return;
    try {
      setLoading(true);
      
      // First load regular items (non-cosmetic)
      const { data: regularItems, error: regularError } = await supabase
        .from('user_inventory')
        .select(`
          *,
          items (
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
        .eq('user_id', state.user.id)
        .not('items.type', 'eq', ItemType.COSMETIC)
        .not('items.type', 'eq', ItemType.AVATAR);

      if (regularError) throw regularError;

      // Then load cosmetic items (titles)
      const { data: cosmeticItems, error: cosmeticError } = await supabase
        .from('user_inventory')
        .select(`
          *,
          items!inner (
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
        .eq('user_id', state.user.id)
        .eq('items.type', ItemType.COSMETIC);

      if (cosmeticError) throw cosmeticError;

      // Transform and combine the items
      const transformedRegularItems = regularItems?.filter(record => record.items).map(record => ({
        id: record.items.id,
        name: record.items.name,
        description: record.items.description,
        type: record.items.type,
        rarity: record.items.rarity,
        equipped: record.equipped,
        quantity: record.quantity,
        effects: record.items.effects,
        metadata: record.items.metadata,
        icon: record.items.icon,
        icon_color: record.items.icon_color,
        imageUrl: record.items.icon || `/images/items/${record.items.type.toLowerCase()}.png`,
        acquired_at: record.acquired_at
      })) || [];

      const transformedCosmeticItems = cosmeticItems?.filter(record => record.items).map(record => ({
        id: record.items.id,
        name: record.items.name,
        description: record.items.description,
        type: record.items.type,
        rarity: record.items.rarity,
        equipped: record.equipped,
        quantity: record.quantity,
        effects: record.items.effects,
        metadata: record.items.metadata,
        icon: record.items.icon,
        icon_color: record.items.icon_color,
        imageUrl: record.items.icon || `/images/items/title.png`,
        acquired_at: record.acquired_at,
        isTitle: true
      })) || [];

      setUserItems([...transformedRegularItems, ...transformedCosmeticItems]);
    } catch (error) {
      console.error('Error loading inventory:', error);
      showError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const loadUserAvatars = async () => {
    if (!state.user) return;
    try {
      const { data: avatars, error } = await supabase
        .from('user_avatars')
        .select(`
          *,
          avatars (
            id,
            name,
            description,
            url,
            rarity
          )
        `)
        .eq('user_id', state.user.id)
        .eq('is_active', true);

      if (error) throw error;

      // Transform the data to match the expected format
      const transformedAvatars = avatars?.map(record => ({
        id: record.avatar_id,
        name: record.avatars.name,
        description: record.avatars.description,
        url: record.avatars.url,
        rarity: record.avatars.rarity,
        is_equipped: record.is_equipped,
        type: ItemType.AVATAR
      })) || [];

      setUserAvatars(transformedAvatars);
    } catch (error) {
      console.error('Error loading avatars:', error);
      showError('Failed to load avatars');
    }
  };

  const handleEquip = async (item: InventoryItem) => {
    if (!state.user) {
      showError('User not logged in');
      return;
    }
    try {
      // If it's a cosmetic title, handle it differently
      if (item.type === ItemType.COSMETIC) {
        // Update local state immediately
        setUserItems(prevItems => 
          prevItems.map(prevItem => ({
            ...prevItem,
            equipped: prevItem.id === item.id ? true : 
              (prevItem.type === ItemType.COSMETIC ? false : prevItem.equipped)
          }))
        );

        // Unequip all titles in user_display_titles
        const { error: titleUnequipError } = await supabase
          .from('user_display_titles')
          .update({ is_equipped: false })
          .eq('user_id', state.user.id);

        if (titleUnequipError) throw titleUnequipError;

        // Equip the selected title
        const { error: titleEquipError } = await supabase
          .from('user_display_titles')
          .upsert({
            user_id: state.user.id,
            title_id: item.id,
            is_equipped: true,
            unlocked_at: new Date().toISOString()
          });

        if (titleEquipError) throw titleEquipError;

        showSuccess('Title equipped!');
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
      setUserItems(prevItems =>
        prevItems.map(prevItem => ({
          ...prevItem,
          equipped: prevItem.id === item.id
        }))
      );

      showSuccess('Item equipped!');
    } catch (error: any) {
      console.error('Error equipping item:', error);
      showError(error.message || 'Failed to equip item');
      // Revert local state on error
      await loadUserInventory();
    }
  };

  const handleUnequip = async (item: InventoryItem) => {
    if (!state.user) {
      showError('User not logged in');
      return;
    }
    try {
      // Update local state immediately
      setUserItems(prevItems =>
        prevItems.map(prevItem => ({
          ...prevItem,
          equipped: prevItem.id === item.id ? false : prevItem.equipped
        }))
      );

      // If it's a cosmetic title, handle it differently
      if (item.type === ItemType.COSMETIC) {
        const { error: titleError } = await supabase
          .from('user_display_titles')
          .update({ is_equipped: false })
          .eq('user_id', state.user.id)
          .eq('title_id', item.id);

        if (titleError) throw titleError;
        
        showSuccess('Title unequipped!');
        return;
      }

      // For regular items
      const { error } = await supabase
        .from('user_inventory')
        .update({ equipped: false })
        .eq('user_id', state.user.id)
        .eq('item_id', item.id);

      if (error) throw error;

      showSuccess('Item unequipped!');
    } catch (error: any) {
      showError(error.message || 'Failed to unequip item');
      // Revert local state on error
      await loadUserInventory();
    }
  };

  const handleUse = async (item: InventoryItem) => {
    // TODO: Implement item usage logic
    console.log('Using item:', item);
  };

  const handleItemSelect = (item: InventoryItem) => {
    setSelectedItem(item);
  };

  const handleEquipAvatar = async (avatar: any) => {
    if (!state.user) {
      showError('User not logged in');
      return;
    }
    try {
      // Update local state immediately
      setUserAvatars(prevAvatars =>
        prevAvatars.map(a => ({
          ...a,
          is_equipped: a.id === avatar.id
        }))
      );

      // First check if the user owns this avatar
      if (!avatar.is_owned) {
        showError('You need to purchase this avatar first');
        await loadUserAvatars(); // Revert state
        return;
      }

      // Update user_avatars table
      const { error: unequipError } = await supabase
        .from('user_avatars')
        .update({ is_equipped: false })
        .eq('user_id', state.user.id);

      if (unequipError) throw unequipError;

      const { error: equipError } = await supabase
        .from('user_avatars')
        .update({ is_equipped: true })
        .eq('user_id', state.user.id)
        .eq('avatar_id', avatar.id);

      if (equipError) throw equipError;

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          avatar_id: avatar.id,
          avatar_url: avatar.url
        })
        .eq('id', state.user.id);

      if (profileError) throw profileError;

      showSuccess('Avatar equipped!');
    } catch (error: any) {
      console.error('Error equipping avatar:', error);
      showError(error.message || 'Failed to equip avatar');
      await loadUserAvatars(); // Revert state on error
    }
  };

  const handleUnequipAvatar = async (avatar: any) => {
    if (!state.user) {
      showError('User not logged in');
      return;
    }
    try {
      // Update local state immediately
      setUserAvatars(prevAvatars =>
        prevAvatars.map(a => ({
          ...a,
          is_equipped: false
        }))
      );

      // Update user_avatars table
      const { error: unequipError } = await supabase
        .from('user_avatars')
        .update({ is_equipped: false })
        .eq('user_id', state.user.id)
        .eq('avatar_id', avatar.id);

      if (unequipError) throw unequipError;

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          avatar_id: null,
          avatar_url: null
        })
        .eq('id', state.user.id);

      if (profileError) throw profileError;

      showSuccess('Avatar unequipped!');
    } catch (error: any) {
      console.error('Error unequipping avatar:', error);
      showError(error.message || 'Failed to unequip avatar');
      await loadUserAvatars(); // Revert state on error
    }
  };

  // Modify the existing filteredItems to handle each tab correctly
  const filteredItems = useMemo(() => {
    // Avatar tab - show only avatars
    if (showAvatars) {
      return userAvatars;
    }

    // Title tab - show only titles
    if (showTitles) {
      return userItems.filter(item => item.type === ItemType.COSMETIC);
    }

    // Regular items tab - show everything except titles and avatars
    return userItems.filter(item => item.type !== ItemType.COSMETIC && item.type !== ItemType.AVATAR);
  }, [userItems, userAvatars, showTitles, showAvatars]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
          Loading inventory...
        </Typography>
      </Box>
    );
  }

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
            {showAvatars ? 'Avatars' : showTitles ? 'Titles' : 'Inventory'}
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
            {showAvatars ? <User size={24} className="text-indigo-500" /> :
             showTitles ? <Crown size={24} className="text-indigo-500" /> : 
             <Package size={24} className="text-indigo-500" />}
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {filteredItems.length} {showAvatars ? 'Avatars' : showTitles ? 'Titles' : 'Items'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Tabs */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Chip
            icon={<Package size={16} />}
            label="Items"
            onClick={() => {
              setShowTitles(false);
              setShowAvatars(false);
              setSelectedCategory(null);
            }}
            sx={{
              bgcolor: !showTitles && !showAvatars ? 'primary.main' : 'background.paper',
              color: !showTitles && !showAvatars ? 'white' : 'text.primary',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: !showTitles && !showAvatars ? 'primary.dark' : 'action.hover'
              }
            }}
          />
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Chip
            icon={<Crown size={16} />}
            label="Titles"
            onClick={() => {
              setShowTitles(true);
              setShowAvatars(false);
              setSelectedCategory(null);
            }}
            sx={{
              bgcolor: showTitles ? 'primary.main' : 'background.paper',
              color: showTitles ? 'white' : 'text.primary',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: showTitles ? 'primary.dark' : 'action.hover'
              }
            }}
          />
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Chip
            icon={<User size={16} />}
            label="Avatars"
            onClick={() => {
              setShowTitles(false);
              setShowAvatars(true);
              setSelectedCategory(null);
            }}
            sx={{
              bgcolor: showAvatars ? 'primary.main' : 'background.paper',
              color: showAvatars ? 'white' : 'text.primary',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: showAvatars ? 'primary.dark' : 'action.hover'
              }
            }}
          />
        </motion.div>
      </Box>

      {/* Category Filter - Only show for items */}
      {!showTitles && !showAvatars && (
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
        </Box>
      )}

      {/* Inventory Grid */}
      {filteredItems.length > 0 ? (
        <InventoryGrid
          items={filteredItems}
          onEquip={showAvatars ? handleEquipAvatar : handleEquip}
          onUnequip={showAvatars ? handleUnequipAvatar : handleUnequip}
          onUse={handleUse}
          onSelect={handleItemSelect}
          isAvatarView={showAvatars}
          showTitles={showTitles}
          selectedCategory={selectedCategory}
          rarityFilter={rarityFilter}
        />
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          gap: 2,
          p: 3,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}>
          {showAvatars ? <User size={48} className="text-gray-400" /> :
           showTitles ? <Crown size={48} className="text-gray-400" /> :
           <Package size={48} className="text-gray-400" />}
          <Typography variant="h6" sx={{ fontWeight: 'medium', textAlign: 'center' }}>
            No {showAvatars ? 'avatars' : showTitles ? 'titles' : 'items'} found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            {selectedCategory 
              ? `You don't have any ${selectedCategory.toLowerCase()} items yet.`
              : `Your ${showAvatars ? 'avatar collection' : showTitles ? 'title collection' : 'inventory'} is empty.`}
          </Typography>
          <Button
            variant="outline"
            onClick={() => navigate('/shop')}
          >
            <Package size={16} className="mr-2" />
            Go to Shop
          </Button>
        </Box>
      )}

      {/* Filter Drawer */}
      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        rarityFilter={rarityFilter}
        onRarityChange={setRarityFilter}
      />

      {/* Item Details Dialog */}
      <ItemDetails
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </Box>
  );
} 