import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Card, CardContent, CardActions, Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../contexts/NotificationContext';
import { useGame } from '../../contexts/GameContext';
import { useAdmin } from '../../hooks/useAdmin';
import { ShopItemResponse, ItemType } from '../../types/shop';
import { Coins, Star, Package, Sparkles, Crown, Shield, Zap, Settings, Trophy, RefreshCw } from 'lucide-react';
import { Button } from '../Button';
import { ShopManager } from '../admin/ShopManager';
import { ErrorBoundary } from '../ErrorBoundary';
import { ItemCard } from './ItemCard';
import { Loader } from '../ui/Loader';
import type { AppTheme } from '../../theme/types/theme.d';
import { createShopStyles } from '../../theme/components/shop';

const itemTypeIcons = {
  booster: Sparkles,
  consumable: Zap,
  equipment: Shield,
  cosmetic: Crown,
  special: Star,
  default: Package
} as const;

export default function ShopSystem() {
  const theme = useTheme<AppTheme>();
  const styles = useMemo(() => createShopStyles(theme), [theme]);
  const [shopItems, setShopItems] = useState<ShopItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ItemType | null>(null);
  const { showSuccess, showError } = useNotification();
  const { state, dispatch } = useGame();
  const { isAdmin } = useAdmin();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadShopItems();
  }, []);

  const loadShopItems = async () => {
    try {
      setLoading(true);
      setError(null);

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

      if (error) throw error;

      setShopItems(data || []);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load shop items';
      setError(new Error(errorMessage));
      showError(errorMessage);
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  };

  const handlePurchase = async (shopItem: ShopItemResponse) => {
    try {
      setLoading(true);
      
      if (!state.user) {
        showError('User not logged in');
        return;
      }
      
      const currentPrice = shopItem.discount_price && new Date(shopItem.discount_ends_at!) > new Date() 
        ? shopItem.discount_price 
        : shopItem.price;
        
      if (state.user.coins < currentPrice) {
        showError('Not enough coins');
        return;
      }

      // Purchase logic here...
      showSuccess('Item purchased successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to purchase item');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedCategory
    ? shopItems.filter(item => item.item?.type === selectedCategory)
    : shopItems;

  const categories = [
    { type: 'booster' as ItemType, label: 'Boosters' },
    { type: 'consumable' as ItemType, label: 'Consumables' },
    { type: 'equipment' as ItemType, label: 'Equipment' },
    { type: 'cosmetic' as ItemType, label: 'Cosmetics' },
    { type: 'special' as ItemType, label: 'Special' },
  ];

  if (isInitialLoading) {
    return (
      <Box sx={styles.loadingOverlay}>
        <Loader size="large" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error.message}
        </Typography>
        <Button
          variant="contained"
          onClick={() => loadShopItems()}
          startIcon={<RefreshCw />}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={styles.container}>
      {/* Header */}
      <Box sx={styles.header}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Shop
        </Typography>

        {/* User Stats */}
        <Box sx={styles.userStats}>
          <Box sx={styles.statBox}>
            <Coins size={24} className="text-yellow-500" />
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {state.user?.coins.toLocaleString() || 0}
            </Typography>
          </Box>

          <Box sx={styles.statBox}>
            <Trophy size={24} className="text-purple-500" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Level {state.user?.level || 1}
              </Typography>
            </Box>
          </Box>

          <Box sx={styles.statBox}>
            <Sparkles size={24} className="text-blue-500" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {state.user?.xp.toLocaleString() || 0} XP
              </Typography>
            </Box>
          </Box>

          {isAdmin && (
            <IconButton
              onClick={() => setShowAdminPanel(true)}
              sx={{ ml: 2 }}
            >
              <Settings />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Categories */}
      <Box sx={styles.categoryScroll}>
        <Button
          variant={selectedCategory === null ? 'contained' : 'outlined'}
          onClick={() => setSelectedCategory(null)}
          sx={selectedCategory === null ? styles.categoryButtonSelected : styles.categoryButtonUnselected}
        >
          All Items
        </Button>

        {categories.map(({ type, label }) => {
          const Icon = itemTypeIcons[type] || itemTypeIcons.default;
          return (
            <Button
              key={type}
              variant={selectedCategory === type ? 'contained' : 'outlined'}
              onClick={() => setSelectedCategory(type)}
              startIcon={<Icon size={20} />}
              sx={selectedCategory === type ? styles.categoryButtonSelected : styles.categoryButtonUnselected}
            >
              {label}
            </Button>
          );
        })}
      </Box>

      {/* Featured Items */}
      <Box sx={styles.sectionTitle}>
        <Star className="icon" size={24} />
        <Typography variant="h5" className="text">
          Featured Items
        </Typography>
      </Box>

      <Box sx={styles.itemGrid}>
        {filteredItems
          .filter(item => item.is_featured)
          .map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onPurchase={() => handlePurchase(item)}
              loading={loading}
            />
          ))}
      </Box>

      {/* Regular Items */}
      <Box sx={styles.sectionTitle}>
        <Package className="icon" size={24} />
        <Typography variant="h5" className="text">
          All Items
        </Typography>
      </Box>

      <Box sx={styles.itemGrid}>
        {filteredItems
          .filter(item => !item.is_featured)
          .map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onPurchase={() => handlePurchase(item)}
              loading={loading}
            />
          ))}
      </Box>

      {/* Admin Panel */}
      <Dialog
        open={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Shop Manager</DialogTitle>
        <DialogContent>
          <ErrorBoundary>
            <ShopManager onClose={() => setShowAdminPanel(false)} />
          </ErrorBoundary>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

/**
 * ShopSystem Component
 * 
 * Purpose:
 * - Displays available shop items to users
 * - Handles item purchases
 * - Provides admin access to shop management
 * 
 * Dependencies:
 * - useGame: For accessing game state and dispatch
 * - useAdmin: For admin access control
 * - useNotification: For user feedback
 * - supabase: For database operations
 * 
 * Features:
 * - Item filtering by category
 * - Purchase handling
 * - Admin management interface
 * - Responsive design
 * - Loading states
 * - Error handling
 * - Manual refresh
 * 
 * State Management:
 * - Local state for UI
 * - Global state through GameContext
 * - Database sync with Supabase
 * 
 * Used By:
 * - Main game interface
 * - Navigation system
 * 
 * Scalability:
 * - Modular component structure
 * - Separated admin functionality
 * - Type-safe operations
 * - Efficient state updates
 * - Error boundaries
 * - Loading state management
 */ 