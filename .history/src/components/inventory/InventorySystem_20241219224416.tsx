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
import { InventoryItem } from '../../types/items';

const rarityColors = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800'
};

const itemTypeIcons = {
  weapon: Shield,
  armor: Shield,
  consumable: Zap,
  cosmetic: Crown,
  special: Star,
  default: Package
};

export default function InventorySystem() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
        acquired_at: record.acquired_at,
        imageUrl: record.item.icon || `/items/${record.item.type.toLowerCase()}.png`
      })) || [];

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

  if (userItems.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Package size={48} className="mx-auto mb-4 text-gray-400" />
        <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }}>
          Your inventory is empty
        </Typography>
        <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary', maxWidth: 'sm', mx: 'auto' }}>
          Visit the store to purchase items or complete quests to earn rewards.
        </Typography>
        <Button
          variant="outline"
          onClick={() => navigate('/store')}
          className="mt-4"
        >
          <Package className="w-4 h-4 mr-2" />
          Go to Store
        </Button>
      </Box>
    );
  }

  const filteredItems = selectedCategory
    ? userItems.filter(item => item.type === selectedCategory)
    : userItems;

  const categories = Array.from(new Set(userItems.map(item => item.type)));

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      <Box sx={{ flex: 1, p: 3 }}>
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 4
          }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Inventory</Typography>
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
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {userItems.length} Items
              </Typography>
            </Box>
          </Box>
        </motion.div>

        {/* Categories */}
        <Box sx={{ mb: 4, display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Chip
              label="All Items"
              onClick={() => setSelectedCategory(null)}
              sx={{
                bgcolor: !selectedCategory ? 'primary.main' : 'background.paper',
                color: !selectedCategory ? 'white' : 'text.primary',
                fontWeight: 'bold'
              }}
            />
          </motion.div>
          {categories.map((category) => (
            <motion.div key={category} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Chip
                label={category.charAt(0).toUpperCase() + category.slice(1)}
                onClick={() => setSelectedCategory(category)}
                sx={{
                  bgcolor: selectedCategory === category ? 'primary.main' : 'background.paper',
                  color: selectedCategory === category ? 'white' : 'text.primary',
                  fontWeight: 'bold'
                }}
              />
            </motion.div>
          ))}
        </Box>

        {/* Inventory Grid */}
        <Grid container spacing={3}>
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => {
              const ItemIcon = itemTypeIcons[item.type as keyof typeof itemTypeIcons] || itemTypeIcons.default;
              return (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <motion.div
                    layout
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", duration: 0.5 }}
                  >
                    <Card sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      overflow: 'visible',
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      boxShadow: 3,
                      '&:hover': {
                        boxShadow: 6,
                      }
                    }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <ItemIcon size={24} color={rarityColors[item.rarity]} />
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {item.name}
                          </Typography>
                        </Box>

                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                          {item.description}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          <Chip
                            size="small"
                            label={item.rarity}
                            sx={{
                              bgcolor: `${rarityColors[item.rarity]}20`,
                              color: rarityColors[item.rarity],
                              fontWeight: 'bold'
                            }}
                          />
                          <Chip
                            size="small"
                            label={item.type}
                            variant="outlined"
                          />
                          {Array.isArray(item.effects) && item.effects.map((effect, index) => (
                            <Tooltip key={index} title={effect.type}>
                              <Chip
                                size="small"
                                icon={<Sparkles size={14} />}
                                label={`${effect.type} +${effect.value}`}
                                sx={{ bgcolor: 'primary.light', color: 'white' }}
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      </CardContent>

                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button
                          variant={item.equipped ? "secondary" : "primary"}
                          onClick={() => item.equipped ? handleUnequip(item) : handleEquip(item)}
                          className="w-full"
                        >
                          {item.equipped ? 'Unequip' : 'Equip'}
                        </Button>
                      </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </AnimatePresence>
        </Grid>
      </Box>
      <Navigation 
        currentView={getCurrentView()}
        onViewChange={handleViewChange}
      />
    </Box>
  );
} 