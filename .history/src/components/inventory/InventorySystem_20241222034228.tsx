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

      {/* Items Grid */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {filteredItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 2,
                border: '1px solid',
                borderColor: 'divider',
                position: 'relative',
                overflow: 'visible'
              }}>
                <Box sx={{
                  position: 'relative',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  {/* Item Icon */}
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mb: 2
                  }}>
                    <ItemIcon 
                      item={item} 
                      size={80}
                      sx={{
                        borderRadius: '12px',
                        boxShadow: 3
                      }}
                    />
                  </Box>

                  {/* Item Info */}
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {item.name}
                    </Typography>
                    <Chip
                      label={item.rarity}
                      size="small"
                      sx={{
                        mb: 1,
                        bgcolor: theme => {
                          switch (item.rarity?.toLowerCase()) {
                            case 'common': return 'grey.500';
                            case 'uncommon': return 'success.main';
                            case 'rare': return 'info.main';
                            case 'epic': return 'secondary.main';
                            case 'legendary': return 'warning.main';
                            default: return 'grey.500';
                          }
                        },
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {item.description}
                    </Typography>
                    {item.effects && item.effects.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Effects:
                        </Typography>
                        {item.effects.map((effect, index) => (
                          <Typography key={index} variant="body2" color="text.secondary">
                            • {effect}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>

                  {/* Item Actions */}
                  <Box sx={{
                    mt: 'auto',
                    display: 'flex',
                    gap: 1,
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Chip
                      label={`Quantity: ${item.quantity}`}
                      size="small"
                      sx={{ fontWeight: 'medium' }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {item.equipped ? (
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleUnequip(item)}
                        >
                          Unequip
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => handleEquip(item)}
                        >
                          Equip
                        </Button>
                      )}
                      {item.type === ItemType.CONSUMABLE && (
                        <Button
                          variant="primary"
                          size="small"
                        >
                          Use
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* No items found */}
      {filteredItems.length === 0 && (
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