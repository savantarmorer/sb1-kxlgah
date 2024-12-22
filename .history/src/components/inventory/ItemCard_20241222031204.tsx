import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box,
  Chip,
  Button,
  useTheme,
  alpha
} from '@mui/material';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import type { Theme } from '@mui/material/styles';
import type { InventoryItem } from '../../types/items';
import { ItemRarity } from '../../types/items';
import { ItemIcon } from '../common/ItemIcon';
import type { ItemEffect } from '../../types/items';

interface ItemCardProps {
  item: InventoryItem;
  onEquip?: () => void;
  onUnequip?: () => void;
  onUse?: () => void;
  onSelect: () => void;
}

const rarityColors = {
  [ItemRarity.COMMON]: 'grey.400',
  [ItemRarity.UNCOMMON]: 'primary.main',
  [ItemRarity.RARE]: 'info.main',
  [ItemRarity.EPIC]: 'secondary.main',
  [ItemRarity.LEGENDARY]: 'warning.main',
} as const;

type PaletteColor = 'grey' | 'primary' | 'info' | 'secondary' | 'warning';
type ColorVariant = '400' | 'main';

export function ItemCard({ item, onEquip, onUnequip, onUse, onSelect }: ItemCardProps) {
  const theme = useTheme<Theme>();

  console.log('[InventoryItemCard] Rendering item:', {
    item,
    imageUrl: item.imageUrl,
    effects: item.effects
  });

  const cardStyles = {
    position: 'relative',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(8px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    transition: theme.transitions.create(['transform', 'box-shadow'], {
      duration: theme.transitions.duration.standard,
    }),
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[4],
    },
    cursor: 'pointer'
  } as const;

  const iconStyles = {
    width: 64,
    height: 64,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    marginBottom: theme.spacing(2),
    boxShadow: theme.shadows[2],
  } as const;

  const rarity = item.rarity?.toLowerCase() as keyof typeof rarityColors;
  const rarityColor = rarity && rarityColors[rarity] 
    ? rarityColors[rarity] 
    : rarityColors[ItemRarity.COMMON];

  const [paletteColor, colorVariant] = rarityColor.split('.') as [PaletteColor, ColorVariant];

  const getBgColor = () => {
    try {
      if (colorVariant === '400') {
        return theme.palette.grey[400];
      }
      const color = theme.palette[paletteColor as keyof typeof theme.palette];
      return typeof color === 'object' && 'main' in color ? color.main : theme.palette.grey[400];
    } catch (e) {
      return theme.palette.grey[400]; // Fallback color
    }
  };

  const renderEffectValue = (effect: ItemEffect) => {
    if (typeof effect.value === 'number') {
      return effect.value.toString();
    }
    return JSON.stringify(effect.value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      onClick={onSelect}
    >
      <Card sx={cardStyles}>
        <CardContent>
          {/* Item Icon */}
          <Box sx={iconStyles}>
            <ItemIcon item={item} size={48} />
          </Box>

          {/* Item Name & Rarity */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {item.name}
            </Typography>
            {item.rarity && (
              <Chip
                label={item.rarity.toUpperCase()}
                size="small"
                sx={{
                  bgcolor: getBgColor(),
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
            )}
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
                    {effect.type}: {renderEffectValue(effect)}
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
              Quantity: {item.quantity}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ 
            mt: 'auto',
            display: 'flex',
            gap: 1,
            flexDirection: 'column'
          }}>
            {onEquip && !item.equipped && (
              <Button 
                variant="contained" 
                onClick={(e) => {
                  e.stopPropagation();
                  onEquip();
                }}
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
            )}
            {onUnequip && item.equipped && (
              <Button 
                variant="outlined" 
                onClick={(e) => {
                  e.stopPropagation();
                  onUnequip();
                }}
                fullWidth
              >
                Unequip
              </Button>
            )}
            {onUse && (
              <Button 
                variant="contained" 
                onClick={(e) => {
                  e.stopPropagation();
                  onUse();
                }}
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
          </Box>

          {/* Equipment Status */}
          {item.equipped && (
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
        </CardContent>
      </Card>
    </motion.div>
  );
} 