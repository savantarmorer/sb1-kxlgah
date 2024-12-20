import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';
import { Shield, Zap, Crown, Star, Package, Sparkles } from 'lucide-react';
import type { GameItem } from '../../types/items';
import { ItemType } from '../../types/items';

interface ItemDetailsProps {
  item: GameItem | null;
  onClose: () => void;
}

const rarityColors = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800'
};

export function ItemDetails({ item, onClose }: ItemDetailsProps) {
  if (!item) return null;

  const iconMap = {
    [ItemType.EQUIPMENT]: Shield,
    [ItemType.CONSUMABLE]: Zap,
    [ItemType.COSMETIC]: Crown,
    [ItemType.MATERIAL]: Star,
    [ItemType.QUEST]: Package,
    [ItemType.LOOTBOX]: Package,
    [ItemType.BOOSTER]: Sparkles
  };

  const ItemIcon = iconMap[item.type] || Shield;

  return (
    <Dialog 
      open={!!item} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ItemIcon size={24} color={rarityColors[item.rarity]} />
          <Typography variant="h6">{item.name}</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography color="text.secondary">
            {item.description}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Chip 
            label={item.rarity} 
            size="small"
            sx={{ 
              bgcolor: `${rarityColors[item.rarity]}20`,
              color: rarityColors[item.rarity],
              fontWeight: 'medium'
            }}
          />
          <Chip 
            label={item.type}
            size="small"
            variant="outlined"
          />
        </Box>

        {item.effects && item.effects.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Effects
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {item.effects.map((effect, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Typography variant="body2">
                    {effect.type}
                  </Typography>
                  <Typography variant="body2" color="primary">
                    {effect.value > 0 ? '+' : ''}{effect.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
} 