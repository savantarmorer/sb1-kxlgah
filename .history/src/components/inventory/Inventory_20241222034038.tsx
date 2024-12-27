import React, { useState } from 'react';
import { useInventory } from '../../hooks/useInventory';
import { useGame } from '../../contexts/GameContext';
import { GameItem, ItemType, ItemRarity, ItemEffect, InventoryItem } from '../../types/items';
import { Box, Grid, Typography, Button, Card, CardContent, CardActions, Chip, CircularProgress, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { AppTheme } from '../../theme/theme';
import { Package, Info, Sparkles, Zap, Shield, Crown, Star, LucideIcon } from 'lucide-react';
import { ItemIcon } from '../common/ItemIcon';

interface ThemeProps {
  theme: AppTheme;
  rarity: ItemRarity;
}

interface RarityConfig {
  common: string;
  uncommon: string;
  rare: string;
  epic: string;
  legendary: string;
}

const getRarityColor = (theme: AppTheme, rarity: ItemRarity): string => {
  const colors: RarityConfig = {
    common: theme.palette.grey[300],
    uncommon: theme.palette.success.light,
    rare: theme.palette.info.light,
    epic: theme.palette.warning.light,
    legendary: theme.palette.error.light
  };
  return colors[rarity];
};

const RarityChip = styled(Chip)<{ rarity: ItemRarity }>(({ theme, rarity }: ThemeProps) => ({
  backgroundColor: getRarityColor(theme, rarity),
  color: theme.palette.getContrastText(getRarityColor(theme, rarity))
}));

const ItemCard = styled(Card)<{ rarity: ItemRarity }>(({ theme, rarity }: ThemeProps) => ({
  border: `2px solid ${getRarityColor(theme, rarity)}`,
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)'
  }
}));

interface ItemCardProps {
  item: InventoryItem;
  quantity: number;
  isEquipped: boolean;
  onUse: (item: InventoryItem) => void;
  onEquip: (item: InventoryItem) => void;
  onUnequip: (item: InventoryItem) => void;
}

const InventoryItemCard: React.FC<ItemCardProps> = ({
  item,
  quantity,
  isEquipped,
  onUse,
  onEquip,
  onUnequip
}) => {
  const theme = useTheme();

  console.log('[InventoryItemCard] Rendering item:', {
    item,
    imageUrl: item.imageUrl,
    effects: item.effects
  });

  return (
    <ItemCard rarity={item.rarity}>
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
          marginBottom: theme.spacing(2),
          boxShadow: theme.shadows[2],
        }}>
          <ItemIcon item={item} size={48} />
        </Box>

        {/* Item Name & Rarity */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            {item.name}
          </Typography>
          <RarityChip label={item.rarity} size="small" rarity={item.rarity} />
        </Box>

        {/* Item Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            minHeight: 60,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.description}
        </Typography>

        {/* Effects Info */}
        {Array.isArray(item.effects) && item.effects.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
              cursor: 'help',
            }}
          >
            <Info size={16} />
            <Typography variant="body2" color="text.secondary">
              {item.effects.filter(effect => effect && typeof effect === 'object').map((effect, index, filteredEffects) => (
                <span key={index}>
                  {effect.type}: {typeof effect.value === 'number' ? effect.value.toString() : JSON.stringify(effect.value)}
                  {effect.duration ? ` (${effect.duration}s)` : ''}
                  {index < filteredEffects.length - 1 ? ', ' : ''}
                </span>
              ))}
            </Typography>
          </Box>
        )}

        {/* Quantity */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Quantity: {quantity}
          </Typography>
        </Box>
      </CardContent>

      {/* Action Buttons */}
      <CardActions sx={{ 
        mt: 'auto',
        display: 'flex',
        gap: 1,
        flexDirection: 'column',
        p: 2
      }}>
        {item.type === ItemType.CONSUMABLE && (
          <Button 
            variant="contained" 
            onClick={() => onUse(item)}
            fullWidth
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
              color: theme.palette.secondary.contrastText,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.secondary.dark}, ${theme.palette.secondary.main})`,
              },
            }}
          >
            Use
          </Button>
        )}
        {(item.type === ItemType.EQUIPMENT || item.type === ItemType.COSMETIC) && (
          isEquipped ? (
            <Button 
              variant="outlined" 
              onClick={() => onUnequip(item)}
              fullWidth
            >
              Unequip
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={() => onEquip(item)}
              fullWidth
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                },
              }}
            >
              Equip
            </Button>
          )
        )}
      </CardActions>

      {/* Equipment Status */}
      {isEquipped && (
        <Box
          sx={{
            position: 'absolute',
            top: theme.spacing(2),
            right: theme.spacing(2),
            bgcolor: 'success.main',
            color: 'success.contrastText',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 'bold',
            backdropFilter: 'blur(4px)',
            boxShadow: 1,
          }}
        >
          Equipped
        </Box>
      )}
    </ItemCard>
  );
};

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
    gap: 1,
    px: 2,
    py: 1,
    borderRadius: 1,
    bgcolor: 'background.paper',
    boxShadow: 1
  },
  filters: {
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
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'repeat(2, 1fr)',
      md: 'repeat(3, 1fr)',
      lg: 'repeat(4, 1fr)'
    },
    gap: 3
  }
} as const;

const itemTypeIcons: Record<string, LucideIcon> = {
  [ItemType.BOOSTER]: Sparkles,
  [ItemType.CONSUMABLE]: Zap,
  [ItemType.EQUIPMENT]: Shield,
  [ItemType.COSMETIC]: Crown,
  [ItemType.MATERIAL]: Star,
  [ItemType.LOOTBOX]: Package,
  default: Package
};

const categories = [
  { type: ItemType.BOOSTER, label: 'Boosters' },
  { type: ItemType.CONSUMABLE, label: 'Consumables' },
  { type: ItemType.EQUIPMENT, label: 'Equipment' },
  { type: ItemType.COSMETIC, label: 'Cosmetics' },
  { type: ItemType.MATERIAL, label: 'Materials' },
  { type: ItemType.LOOTBOX, label: 'Lootboxes' }
];

interface InventoryProps {
  className?: string;
}

export const Inventory: React.FC<InventoryProps> = ({ className }) => {
  const { state } = useGame();
  const {
    inventory,
    activeEffects,
    useItem,
    equipItem,
    unequipItem
  } = useInventory();
  const [selectedCategory, setSelectedCategory] = useState<ItemType | null>(null);
  const theme = useTheme();

  const filteredItems = selectedCategory
    ? inventory.filter(item => item.type === selectedCategory)
    : inventory;

  if (state.syncing) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={styles.container} className={className}>
      {/* Header */}
      <Box sx={styles.header}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Inventory
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your items and equipment
          </Typography>
        </Box>
        <Box sx={styles.userStats}>
          <Box sx={styles.statBox}>
            <Typography variant="body1">
              {filteredItems.length} items
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Category Filter */}
      <Box sx={styles.filters}>
        <Button
          variant="contained"
          onClick={() => setSelectedCategory(null)}
          sx={selectedCategory === null ? styles.categoryButtonSelected : styles.categoryButtonUnselected}
          startIcon={<Package size={20} />}
        >
          All Items
        </Button>
        {categories.map(({ type, label }) => {
          const Icon = itemTypeIcons[type] || itemTypeIcons.default;
          return (
            <Button
              key={type}
              variant="contained"
              onClick={() => setSelectedCategory(type)}
              sx={selectedCategory === type ? styles.categoryButtonSelected : styles.categoryButtonUnselected}
              startIcon={<Icon size={20} />}
            >
              {label}
            </Button>
          );
        })}
      </Box>

      {/* Items Grid */}
      <Box sx={styles.itemGrid}>
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <InventoryItemCard
              key={item.id}
              item={item}
              quantity={item.quantity}
              isEquipped={item.equipped || false}
              onUse={useItem}
              onEquip={equipItem}
              onUnequip={unequipItem}
            />
          ))
        ) : (
          <Box
            sx={{
              gridColumn: '1 / -1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              py: 8,
            }}
          >
            <Package size={48} color={theme.palette.text.secondary} />
            <Typography variant="h6" color="text.secondary">
              No items found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedCategory
                ? `You don't have any ${selectedCategory.toLowerCase()} items yet`
                : 'Your inventory is empty'}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}; 