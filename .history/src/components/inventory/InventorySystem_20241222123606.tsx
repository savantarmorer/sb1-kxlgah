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
        .eq('user_id', state.user.id);

      if (error) throw error;

      // Transform the data to match the expected format
      const transformedAvatars = avatars?.map(record => ({
        id: record.avatar_id,
        name: record.avatars.name,
        description: record.avatars.description,
        url: record.avatars.url,
        rarity: record.avatars.rarity,
        is_equipped: record.is_equipped,
        type: ItemType.AVATAR,
        is_owned: true // Since these are from user_avatars, they are owned
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
      p: { xs: 2, sm: 3, md: 4 },
      gap: 4
    }}>
      {/* Modern Header with Stats */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 3,
        mb: 2
      }}>
        {/* Left side - Title and Description */}
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 800,
              background: 'linear-gradient(45deg, primary.main, secondary.main)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            {showAvatars ? 'Avatar Collection' : showTitles ? 'Title Gallery' : 'Inventory'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {showAvatars ? 'Customize your appearance' : 
             showTitles ? 'Show off your achievements' : 
             'Manage your items and equipment'}
          </Typography>
        </Box>

        {/* Right side - Stats Cards */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <Box sx={{ 
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1,
            border: '1px solid',
            borderColor: 'divider',
            minWidth: 160,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            {showAvatars ? <User size={24} className="text-indigo-500" /> :
             showTitles ? <Crown size={24} className="text-indigo-500" /> : 
             <Package size={24} className="text-indigo-500" />}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {filteredItems.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {showAvatars ? 'Avatars' : showTitles ? 'Titles' : 'Items'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Modern Tab Navigation */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        width: '100%',
        bgcolor: 'background.paper',
        p: 1,
        borderRadius: 3,
        boxShadow: 1,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Button
          variant={!showTitles && !showAvatars ? "primary" : "ghost"}
          onClick={() => {
            setShowTitles(false);
            setShowAvatars(false);
            setSelectedCategory(null);
          }}
          fullWidth
          startIcon={<Package size={18} />}
        >
          Items
        </Button>
        <Button
          variant={showTitles ? "primary" : "ghost"}
          onClick={() => {
            setShowTitles(true);
            setShowAvatars(false);
            setSelectedCategory(null);
          }}
          fullWidth
          startIcon={<Crown size={18} />}
        >
          Titles
        </Button>
        <Button
          variant={showAvatars ? "primary" : "ghost"}
          onClick={() => {
            setShowTitles(false);
            setShowAvatars(true);
            setSelectedCategory(null);
          }}
          fullWidth
          startIcon={<User size={18} />}
        >
          Avatars
        </Button>
      </Box>

      {/* Category Filter - Only show for items */}
      {!showTitles && !showAvatars && (
        <Box sx={{ 
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          width: '100%',
          overflowX: 'auto',
          py: 1
        }}>
          <Button
            variant={!selectedCategory ? "primary" : "ghost"}
            onClick={() => setSelectedCategory(null)}
            fullWidth
            startIcon={<Package size={18} />}
          >
            All Items
          </Button>
          {categories.map(({ type, label }) => {
            const Icon = itemTypeIcons[type] || itemTypeIcons.default;
            return (
              <Button
                key={type}
                variant={selectedCategory === type ? "primary" : "ghost"}
                onClick={() => setSelectedCategory(type)}
                fullWidth
                startIcon={<Icon size={18} />}
              >
                {label}
              </Button>
            );
          })}
        </Box>
      )}

      {/* Grid Container with Animation */}
      <Box sx={{ 
        flex: 1,
        bgcolor: 'background.paper',
        borderRadius: 3,
        p: { xs: 2, sm: 3 },
        boxShadow: 1,
        border: '1px solid',
        borderColor: 'divider'
      }}>
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
            minHeight: '300px',
            gap: 3,
            textAlign: 'center'
          }}>
            {showAvatars ? <User size={64} className="text-gray-300" /> :
             showTitles ? <Crown size={64} className="text-gray-300" /> :
             <Package size={64} className="text-gray-300" />}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                No {showAvatars ? 'avatars' : showTitles ? 'titles' : 'items'} found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {selectedCategory 
                  ? `You don't have any ${selectedCategory.toLowerCase()} items yet.`
                  : `Your ${showAvatars ? 'avatar collection' : showTitles ? 'title collection' : 'inventory'} is empty.`}
              </Typography>
              <Button
                variant="primary"
                onClick={() => navigate('/shop')}
                startIcon={<Package size={18} />}
              >
                Visit Shop
              </Button>
            </Box>
          </Box>
        )}
      </Box>

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