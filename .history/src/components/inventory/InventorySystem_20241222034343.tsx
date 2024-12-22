import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Card, CardContent, CardActions, Chip, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase.ts';
import { useNotification } from '../../contexts/NotificationContext';
import { useGame } from '../../contexts/GameContext';
import { Package, Shield, Zap, Crown, Star, Sparkles } from 'lucide-react';
import Navigation from '../Navigation';
import { useNavigate, useLocation } from 'react-router-dom';
import { View } from '../../types/navigation';
import Button from '../Button';
import { InventoryItem, ItemType } from '../../types/items';
import { ItemIcon } from '../common/ItemIcon';

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

export default function InventorySystem() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<ItemType | null>(null);
  const { showSuccess, showError } = useNotification();
  const { state, dispatch } = useGame();
  const [loading, setLoading] = useState(true);
  const [userItems, setUserItems] = useState<InventoryItem[]>([]);

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

      console.log('[InventorySystem] Raw inventory data:', data);

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

      console.log('[InventorySystem] Transformed items:', transformedItems);

      setUserItems(transformedItems);
    } catch (error) {
      console.error('Error loading inventory:', error);
      showError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleEquip = async (item: InventoryItem) => {
    if (!state.user) {
      showError('User not logged in');
      return;
    }
    try {
      const { error } = await supabase
        .from('user_inventory')
        .update({ equipped: true })
        .eq('user_id', state.user.id)
        .eq('item_id', item.id);

      if (error) throw error;

      await loadUserInventory();
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
      const { error } = await supabase
        .from('user_inventory')
        .update({ equipped: false })
        .eq('user_id', state.user.id)
        .eq('item_id', item.id);

      if (error) throw error;

      await loadUserInventory();
      showSuccess('Item unequipped!');
    } catch (error: any) {
      showError(error.message || 'Failed to unequip item');
    }
  };

  const handleViewChange = (view: View) => {
    navigate(view);
  };

  const getCurrentView = (): View => {
    switch (location.pathname) {
      case '/inventory':
        return '/inventory' as View;
      case '/home':
        return '/' as View;
      default:
        return location.pathname as View;
    }
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

  const filteredItems = selectedCategory
    ? userItems.filter(item => item.type === selectedCategory)
    : userItems;

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
            Inventory
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
            <Package size={24} className="text-indigo-500" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {filteredItems.length} Items
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Category Filter */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Chip
            icon={<Package size={16} />}
            label="Todos os Itens"
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

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
        <Grid container spacing={3}>
          {filteredItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <CardContent>
                  {/* Item Icon */}
                  <Box sx={{ 
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 2,
                    bgcolor: 'background.default',
                    boxShadow: 1
                  }}>
                    <ItemIcon item={item} size={48} />
                  </Box>

                  {/* Item Name & Type */}
                  <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>
                    {item.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
                    <Chip
                      label={item.rarity}
                      size="small"
                      sx={{
                        bgcolor: `${item.rarity.toLowerCase()}.main`,
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                    <Chip
                      label={item.type}
                      size="small"
                      sx={{ fontWeight: 'medium' }}
                    />
                  </Box>

                  {/* Item Description */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.description}
                  </Typography>

                  {/* Quantity */}
                  <Typography variant="body2" color="text.secondary">
                    Quantity: {item.quantity}
                  </Typography>
                </CardContent>

                <CardActions sx={{ mt: 'auto', p: 2 }}>
                  {item.type === ItemType.CONSUMABLE ? (
                    <Button
                      variant="primary"
                      onClick={() => {}}
                      fullWidth
                    >
                      Use
                    </Button>
                  ) : (
                    item.equipped ? (
                      <Button
                        variant="outline"
                        onClick={() => handleUnequip(item)}
                        fullWidth
                      >
                        Unequip
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => handleEquip(item)}
                        fullWidth
                      >
                        Equip
                      </Button>
                    )
                  )}
                </CardActions>

                {item.equipped && (
                  <Box sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'success.main',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    Equipped
                  </Box>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          py: 8
        }}>
          <Package size={48} className="text-gray-400" />
          <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
            No items found
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
            {selectedCategory
              ? `You don't have any ${selectedCategory.toLowerCase()} items yet`
              : 'Your inventory is empty'}
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
    </Box>
  );
} 