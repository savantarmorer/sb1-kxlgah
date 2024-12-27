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
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

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

  const renderEffectValue = (effect: ItemEffect) => {
    if (typeof effect.value === 'number') {
      return effect.value.toString();
    }
    return JSON.stringify(effect.value);
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
            borderRadius: 2,
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.3s ease-in-out'
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
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        borderRadius: 2,
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.1),
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.3s ease-in-out'
      }}>
        {item.icon ? (
          <Box
            component="img"
            src={item.icon}
            alt={item.name}
            sx={{
              width: '60%',
              height: '60%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.1))'
            }}
          />
        ) : (
          <ItemIcon item={item} size={48} />
        )}
      </Box>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      onClick={() => onSelect?.(item)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: alpha(theme.palette.background.paper, isHovered ? 0.9 : 0.8),
        backdropFilter: 'blur(8px)',
        border: '1px solid',
        borderColor: alpha(getRarityColor(item.rarity), 0.3),
        borderRadius: 3,
        transition: theme.transitions.create(
          ['transform', 'box-shadow', 'background-color', 'border-color'],
          { duration: theme.transitions.duration.standard }
        ),
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: `0 8px 24px ${alpha(getRarityColor(item.rarity), 0.2)}`,
          borderColor: alpha(getRarityColor(item.rarity), 0.5),
        },
        cursor: 'pointer',
        overflow: 'hidden'
      }}>
        {/* Rarity Indicator */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          bgcolor: getRarityColor(item.rarity),
          opacity: isHovered ? 0.8 : 0.5,
          transition: 'opacity 0.3s ease-in-out'
        }} />

        <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Image */}
          {renderImage()}

          {/* Item Info */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold',
                color: isHovered ? 'text.primary' : 'text.secondary'
              }}>
                {item.name}
              </Typography>
              {(item.is_equipped || item.equipped) && (
                <Chip
                  size="small"
                  label="Equipped"
                  color="primary"
                  sx={{ 
                    height: 20,
                    '& .MuiChip-label': { px: 1, fontSize: '0.75rem' }
                  }}
                />
              )}
            </Box>
            <Chip
              size="small"
              label={item.rarity}
              sx={{
                bgcolor: alpha(getRarityColor(item.rarity), 0.1),
                color: getRarityColor(item.rarity),
                fontWeight: 'medium',
                border: '1px solid',
                borderColor: alpha(getRarityColor(item.rarity), 0.2),
                '& .MuiChip-label': { px: 1 }
              }}
            />
          </Box>

          {/* Description */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              opacity: isHovered ? 1 : 0.8,
              transition: 'opacity 0.3s ease-in-out',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: 40
            }}
          >
            {item.description}
          </Typography>

          {/* Effects */}
          {Array.isArray(item.effects) && item.effects.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                p: 1.5,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.background.default, 0.5),
                border: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.1)
              }}
            >
              <Info size={16} className="text-indigo-400" />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
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
            <Box sx={{ 
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Package size={16} className="text-gray-400" />
              <Typography variant="body2" color="text.secondary">
                {item.quantity}
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
            {isAvatarView ? (
              item.is_owned ? (
                item.is_equipped ? (
                  <Button
                    variant="ghost"
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
                )
              ) : (
                <Button
                  variant="solid"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/shop');
                  }}
                  fullWidth
                  color="secondary"
                >
                  Buy in Shop
                </Button>
              )
            ) : (
              (item.is_equipped || item.equipped) ? (
                <Button
                  variant="ghost"
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
              )
            )}
            {onUse && !isAvatarView && (
              <Button
                variant="outline"
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