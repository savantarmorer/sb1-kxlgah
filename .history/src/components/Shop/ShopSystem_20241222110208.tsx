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
import { DisplayTitle } from '../../types/titles';

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

interface TitleItemProps {
  title: DisplayTitle;
  onPurchase: () => void;
  isOwned: boolean;
}

const getRarityStyle = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'legendary':
      return 'bg-gradient-to-r from-yellow-300 to-amber-500 animate-pulse shadow-lg shadow-yellow-500/50';
    case 'epic':
      return 'bg-gradient-to-r from-purple-400 to-pink-500 shadow-lg shadow-purple-500/50';
    case 'rare':
      return 'bg-gradient-to-r from-blue-400 to-cyan-500 shadow-lg shadow-blue-500/50';
    default: // common
      return 'bg-gradient-to-r from-gray-400 to-slate-500';
  }
};

const TitleCard = ({ title, onPurchase, isOwned }: TitleItemProps) => {
  const rarityStyle = getRarityStyle(title.rarity);
  
  return (
    <div className={`relative rounded-lg p-6 ${rarityStyle} transform transition-all duration-300 hover:scale-105`}>
      <div className="absolute top-2 right-2">
        <span className={`px-2 py-1 rounded-full text-xs font-bold 
          ${title.rarity === 'legendary' ? 'bg-yellow-300 text-yellow-900' :
            title.rarity === 'epic' ? 'bg-purple-300 text-purple-900' :
            title.rarity === 'rare' ? 'bg-blue-300 text-blue-900' :
            'bg-gray-300 text-gray-900'}`}>
          {title.rarity.toUpperCase()}
        </span>
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <Crown className={`w-6 h-6 
          ${title.rarity === 'legendary' ? 'text-yellow-300' :
            title.rarity === 'epic' ? 'text-purple-300' :
            title.rarity === 'rare' ? 'text-blue-300' :
            'text-gray-300'}`} />
        <h3 className="text-lg font-bold text-white">{title.name}</h3>
      </div>
      
      <p className="text-white/80 text-sm mb-4">{title.description}</p>
      
      {title.requirements?.level > 0 && (
        <p className="text-white/70 text-xs mb-4">
          Required Level: {title.requirements.level}
        </p>
      )}
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/icons/coin.png" alt="Coins" className="w-5 h-5" />
          <span className="text-white font-bold">{title.price}</span>
        </div>
        
        <button
          onClick={onPurchase}
          disabled={isOwned}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors
            ${isOwned 
              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
              : 'bg-white text-gray-900 hover:bg-gray-100'}`}
        >
          {isOwned ? 'Owned' : 'Purchase'}
        </button>
      </div>
    </div>
  );
};

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
      setError(null);
      
      const { data: shopItems, error } = await supabase
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
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('[ShopSystem] Raw shop items:', shopItems);

      setShopItems(shopItems as ShopItemResponse[]);
    } catch (error: any) {
      console.error('[ShopSystem] Error fetching shop items:', error);
      const errorMessage = error.message || 'Failed to load shop items';
      setError(new Error(errorMessage));
      showError(errorMessage);
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  };

  // Fetch shop items on mount
  useEffect(() => {
    void fetchShopItems();
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

  const renderTitles = () => {
    const titleItems = shopItems.filter(item => item.item?.type === 'title');
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {titleItems.map((item) => (
          <TitleCard
            key={item.id}
            title={item.data as DisplayTitle}
            onPurchase={() => handlePurchase(item)}
            isOwned={ownedItems.includes(item.id)}
          />
        ))}
      </div>
    );
  };

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