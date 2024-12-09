import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Card, CardContent, CardActions, Chip, IconButton, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../contexts/NotificationContext';
import { use_game } from '../../contexts/GameContext';
import { ShopItemResponse } from '../../types/shop';
import { Coins, Star, Package, Sparkles, Crown, Shield, Zap, Info } from 'lucide-react';
import Navigation from '../Navigation';
import { useNavigate, useLocation } from 'react-router-dom';
import { View } from '../../types/navigation';
import Button from '../Button';

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

export default function ShopSystem() {
  const navigate = useNavigate();
  const location = useLocation();
  const [shopItems, setShopItems] = useState<ShopItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { showSuccess, showError } = useNotification();
  const { state, dispatch } = use_game();

  useEffect(() => {
    loadShopItems();
  }, []);

  const loadShopItems = async () => {
    const { data, error } = await supabase
      .from('shop_items')
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
      .eq('is_available', true)
      .order('is_featured', { ascending: false });

    if (error) {
      showError('Failed to load shop items');
      return;
    }

    setShopItems(data || []);
  };

  const handlePurchase = async (shopItem: ShopItemResponse) => {
    try {
      setLoading(true);
      
      const currentPrice = shopItem.discount_price && new Date(shopItem.discount_ends_at!) > new Date() 
        ? shopItem.discount_price 
        : shopItem.price;
        
      if (state.user.coins < currentPrice) {
        showError('Not enough coins');
        return;
      }

      const { error: purchaseError } = await supabase.rpc('purchase_shop_item', {
        p_shop_item_id: shopItem.id,
        p_user_id: state.user.id,
        p_quantity: 1
      });

      if (purchaseError) throw purchaseError;

      dispatch({
        type: 'ADD_INVENTORY_ITEM',
        payload: {
          item: shopItem.item,
          quantity: 1
        }
      });

      dispatch({
        type: 'UPDATE_COINS',
        payload: -currentPrice
      });

      showSuccess('Item purchased!');
      loadShopItems();
      
    } catch (error: any) {
      showError(error.message || 'Failed to purchase item');
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (view: View) => {
    navigate(view);
  };

  const getCurrentView = (): View => {
    switch (location.pathname) {
      case '/shop':
        return '/shop' as View;
      case '/home':
        return '/' as View;
      default:
        return location.pathname as View;
    }
  };

  const filteredItems = selectedCategory
    ? shopItems.filter(item => item.item.type === selectedCategory)
    : shopItems;

  const categories = Array.from(new Set(shopItems.map(item => item.item.type)));

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
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Shop</Typography>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
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
                <Coins size={24} className="text-yellow-500" />
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {state.user.coins.toLocaleString()}
                </Typography>
              </Box>
            </motion.div>
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

        {/* Shop Items Grid */}
        <Grid container spacing={3}>
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => {
              const ItemIcon = itemTypeIcons[item.item.type as keyof typeof itemTypeIcons] || itemTypeIcons.default;
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
                      {item.is_featured && (
                        <Box sx={{ 
                          position: 'absolute',
                          top: -10,
                          right: -10,
                          bgcolor: 'warning.main',
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 2,
                          zIndex: 1
                        }}>
                          <Star size={18} className="text-white" />
                        </Box>
                      )}
                      
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <ItemIcon size={24} color={rarityColors[item.item.rarity]} />
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {item.item.name}
                          </Typography>
                        </Box>

                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                          {item.item.description}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          <Chip
                            size="small"
                            label={item.item.rarity}
                            sx={{
                              bgcolor: `${rarityColors[item.item.rarity]}20`,
                              color: rarityColors[item.item.rarity],
                              fontWeight: 'bold'
                            }}
                          />
                          <Chip
                            size="small"
                            label={item.item.type}
                            variant="outlined"
                          />
                          {Array.isArray(item.item.effects) && item.item.effects.map((effect, index) => (
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

                        <Box sx={{ mt: 'auto' }}>
                          {item.discount_price ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ textDecoration: 'line-through' }}
                              >
                                {item.price}
                              </Typography>
                              <Typography variant="h6" color="error.main" sx={{ fontWeight: 'bold' }}>
                                {item.discount_price} <Coins size={16} className="inline" />
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {item.price} <Coins size={16} className="inline" />
                            </Typography>
                          )}
                        </Box>
                      </CardContent>

                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button
                          variant="primary"
                          onClick={() => handlePurchase(item)}
                          disabled={loading || (typeof item.stock === 'number' && item.stock <= 0)}
                          className="w-full relative overflow-hidden"
                        >
                          {typeof item.stock === 'number' && item.stock <= 0 
                            ? 'Out of Stock' 
                            : 'Purchase'
                          }
                          {loading && (
                            <motion.div
                              className="absolute inset-0 bg-white/20"
                              animate={{ x: ['0%', '100%'] }}
                              transition={{ 
                                duration: 1,
                                repeat: Infinity,
                                ease: 'linear'
                              }}
                            />
                          )}
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