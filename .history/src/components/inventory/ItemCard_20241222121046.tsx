import React, { useState } from 'react';
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
import { useNotification } from '../../hooks/useNotification';

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
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'equip' | 'unequip' | 'use') => {
    if (loading) return;
    setLoading(true);
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
      setLoading(false);
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
          <Package size={48} className="text-gray-400" />
        )}
      </Box>
    );
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect?.(item)}
    >
      <Box sx={{
        position: 'relative',
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 4,
          borderColor: 'primary.main'
        }
      }}>
        {/* Image */}
        {renderImage()}

        {/* Content */}
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            {item.name}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              size="small"
              label={item.rarity}
              sx={{
                bgcolor: getRarityColor(item.rarity),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
            {item.is_equipped && (
              <Chip
                size="small"
                label="Equipped"
                color="primary"
                sx={{ fontWeight: 'bold' }}
              />
            )}
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {item.is_equipped ? (
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('unequip');
                }}
                loading={loading}
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
                loading={loading}
                fullWidth
              >
                Equip
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
} 