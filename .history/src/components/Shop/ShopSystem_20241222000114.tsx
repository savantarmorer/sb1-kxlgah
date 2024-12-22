import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Card, CardContent, CardActions, Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, CircularProgress } from '@mui/material';
import { useTheme, Theme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../contexts/NotificationContext';
import { useGame } from '../../contexts/GameContext';
import { useAdmin } from '../../hooks/useAdmin';
import { ShopItemResponse } from '../../types/shop';
import { ItemType, GameItem } from '../../types/items';
import { Coins, Star, Package, Sparkles, Crown, Shield, Zap, Settings, Trophy, RefreshCw } from 'lucide-react';
import { Button } from '../Button';
import { ShopManager } from '../admin/ShopManager';
import { ErrorBoundary } from '../ErrorBoundary';
import { ItemCard } from './ItemCard';
import { Loader } from '../Loader';
import { gameActions } from '../../contexts/game/actions';

const styles = {
  container: {
    p: 3,
    display: 'flex',
    flexDirection: 'column',
    gap: 3
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    mb: 3
  },
  userStats: {
    display: 'flex',
    alignItems: 'center',
    gap: 3
  },
  statBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 1
  },
  categoryScroll: {
    display: 'flex',
    gap: 2,
    overflowX: 'auto',
    pb: 2
  },
  categoryButtonSelected: {
    bgcolor: 'primary.main',
    color: 'white',
    '&:hover': {
      bgcolor: 'primary.dark'
    }
  },
  categoryButtonUnselected: {
    bgcolor: 'background.paper',
    '&:hover': {
      bgcolor: 'action.hover'
    }
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 2
  },
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'repeat(2, 1fr)',
      md: 'repeat(3, 1fr)',
      lg: 'repeat(4, 1fr)'
    },
    gap: 3
  },
  loadingOverlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    width: '100%'
  }
} as const;

const itemTypeIcons = {
  [ItemType.BOOSTER]: Sparkles,
  [ItemType.CONSUMABLE]: Zap,
  [ItemType.EQUIPMENT]: Shield,
  [ItemType.COSMETIC]: Crown,
  [ItemType.MATERIAL]: Star,
  default: Package
} as const;

export default function ShopSystem() {
  const theme = useTheme<Theme>();
  const [shopItems, setShopItems] = useState<ShopItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ItemType | null>(null);
  const { showSuccess, showError } = useNotification();
  const { state, dispatch } = useGame();
  const { isAdmin } = useAdmin();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchShopItems = async () => {
    try {
      setLoading(true);
      const { data: shopItems, error } = await supabase
        .from('shop_items')
        .select(`
          *,
          item:items (*)
        `)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShopItems(shopItems as ShopItemResponse[]);
    } catch (error: any) {
      console.error('[ShopSystem] Error fetching shop items:', error);
      showError('Failed to load shop items');
    } finally {
      setLoading(false);
    }
  };

  // Fetch shop items on mount
  useEffect(() => {
    fetchShopItems();
  }, []);

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

      // Convert shop item to game item format
      const gameItem: GameItem = {
        id: shopItem.item_id,
        name: shopItem.item?.name || '',
        description: shopItem.item?.description || '',
        type: shopItem.item?.type || 'CONSUMABLE',
        rarity: shopItem.item?.rarity || 'COMMON',
        cost: shopItem.price,
        effects: shopItem.item?.effects || [],
        imageUrl: shopItem.item?.imageUrl || '',
        is_active: true,
        metadata: shopItem.item?.metadata || {},
        requirements: {},
        icon: shopItem.item?.icon ?? undefined,
        icon_color: shopItem.item?.icon_color ?? undefined,
        shopData: {
          featured: shopItem.is_featured,
          discount: shopItem.discount_price ?? undefined,
          endDate: shopItem.discount_ends_at ?? undefined
        }
      };

      // Call handleItemTransaction to process the purchase
      await gameActions.handleItemTransaction(
        state,
        gameItem,
        1, // quantity
        'purchase',
        currentPrice,
        dispatch
      );

      showSuccess('Item purchased successfully!');
      
      // Refresh shop items after successful purchase
      await fetchShopItems();
    } catch (error: any) {
      console.error('[ShopSystem] Purchase error:', error);
      showError(error.message || 'Failed to purchase item. Please try again.');
      
      // Refresh state to ensure consistency
      await fetchShopItems();
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedCategory
    ? shopItems.filter(item => item.item?.type === selectedCategory)
    : shopItems;

  const categories = [
    { type: ItemType.BOOSTER, label: 'Boosters' },
    { type: ItemType.CONSUMABLE, label: 'Consumables' },
    { type: ItemType.EQUIPMENT, label: 'Equipment' },
    { type: ItemType.COSMETIC, label: 'Cosmetics' },
    { type: ItemType.MATERIAL, label: 'Special' }
  ];

  if (isInitialLoading) {
    return (
      <Box sx={styles.loadingOverlay}>
        <Loader size="lg" />
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
          variant="primary"
          onClick={() => fetchShopItems()}
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
          variant={selectedCategory === null ? 'primary' : 'outline'}
          onClick={() => setSelectedCategory(null)}
          sx={selectedCategory === null ? styles.categoryButtonSelected : styles.categoryButtonUnselected}
        >
          All Items
        </Button>

        {categories.map(({ type, label }) => {
          const Icon = itemTypeIcons[type as keyof typeof itemTypeIcons] || itemTypeIcons.default;
          return (
            <Button
              key={type}
              variant={selectedCategory === type ? 'primary' : 'outline'}
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
            <ShopManager />
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