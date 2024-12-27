import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import { motion } from 'framer-motion';
import { Info, Package } from 'lucide-react';
import type { Theme } from '@mui/material/styles';
import type { InventoryItem } from '../../types/items';
import { ItemRarity } from '../../types/items';
import { ItemIcon } from '../common/ItemIcon';
import type { ItemEffect } from '../../types/items';
import { useNotification } from '../../hooks/useNotification';
import Button from '../Button';

interface ItemCardProps {
  item: any;
  onEquip?: (item: any) => void;
  onUnequip?: (item: any) => void;
  onUse?: (item: any) => void;
  onSelect?: (item: any) => void;
  isAvatarView?: boolean;
}

const rarityColors = {
  common: 'rgb(158, 158, 158)',     // Grey
  uncommon: 'rgb(56, 142, 60)',     // Green
  rare: 'rgb(30, 136, 229)',        // Blue
  epic: 'rgb(156, 39, 176)',        // Purple
  legendary: 'rgb(245, 124, 0)',    // Orange
  default: 'rgb(158, 158, 158)'     // Default grey
};

const getRarityColor = (rarity: string): string => {
  const key = rarity?.toLowerCase() || 'default';
  return rarityColors[key as keyof typeof rarityColors] || rarityColors.default;
};

export function ItemCard({ item, onEquip, onUnequip, onUse, onSelect, isAvatarView }: ItemCardProps) {
  const theme = useTheme<Theme>();
  const { showSuccess, showError } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: 'equip' | 'unequip' | 'use') => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      switch (action) {
        case 'equip':
          if (onEquip) await onEquip(item);
          break;
        case 'unequip':
          if (onUnequip) await onUnequip(item);
          break;
        case 'use':
          if (onUse) await onUse(item);
          break;
      }
    } catch (error) {
      console.error(`Error ${action}ing item:`, error);
      showError(`Failed to ${action} item`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderImage = () => {
    if (isAvatarView) {
      return (
        <Box
          component="img"
          src={item.url}
          alt={item.name}
          sx={{
            width: '100%',
            height: 'auto',
            aspectRatio: '1',
            objectFit: 'cover',
            borderRadius: 2
          }}
        />
      );
    }

    return (
      <Box sx={{
        width: '100%',
        aspectRatio: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        {item.icon ? (
          <Box
            component="img"
            src={item.icon}
            alt={item.name}
            sx={{
              width: '60%',
              height: '60%',
              objectFit: 'contain'
            }}
          />
        ) : (
          <ItemIcon item={item} size={48} />
        )}
      </Box>
    );
  };

  const renderEffectValue = (effect: ItemEffect) => {
    if (typeof effect.value === 'number') {
      return effect.value.toString();
    }
    return JSON.stringify(effect.value);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect?.(item)}
    >
      <Card sx={{
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
      }}>
        <CardContent>
          {/* Image */}
          {renderImage()}

          {/* Item Name & Rarity */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {item.name}
            </Typography>
            <Chip
              size="small"
              label={item.rarity}
              sx={{
                bgcolor: getRarityColor(item.rarity),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
            {(item.is_equipped || item.equipped) && (
              <Chip
                size="small"
                label="Equipped"
                color="primary"
                sx={{ ml: 1, fontWeight: 'bold' }}
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
          {!isAvatarView && item.quantity !== undefined && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Quantity: {item.quantity}
              </Typography>
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ 
            mt: 'auto',
            display: 'flex',
            gap: 1,
            flexDirection: 'column'
          }}>
            {(item.is_equipped || item.equipped) ? (
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('unequip');
                }}
                loading={isLoading ? "true" : undefined}
                fullWidth
              >
                Unequip
              </Button>
            ) : (
              <Button
                variant="solid"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('equip');
                }}
                loading={isLoading ? "true" : undefined}
                fullWidth
              >
                Equip
              </Button>
            )}
            {onUse && !isAvatarView && (
              <Button
                variant="solid"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('use');
                }}
                loading={isLoading ? "true" : undefined}
                fullWidth
                color="secondary"
              >
                Use
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
} 