import React, { useState } from 'react';
import { useInventory } from '../../hooks/useInventory';
import { useGame } from '../../contexts/GameContext';
import { GameItem, ItemType, ItemRarity, ItemEffect, InventoryItem } from '../../types/items';
import { Box, Grid, Typography, Button, Card, CardContent, CardActions, Chip, CircularProgress, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { AppTheme } from '../../theme/theme';
import { Package, Info } from 'lucide-react';
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
    <Box className={className}>
      <Grid container spacing={3}>
        {inventory.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <InventoryItemCard
              item={item}
              quantity={item.quantity}
              isEquipped={activeEffects.some(effect => effect.sourceItemId === item.id)}
              onUse={useItem}
              onEquip={equipItem}
              onUnequip={unequipItem}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}; 