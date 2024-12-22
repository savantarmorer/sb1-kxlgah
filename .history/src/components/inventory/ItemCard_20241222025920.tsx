import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box,
  IconButton,
  Tooltip,
  Chip,
  Button
} from '@mui/material';
import type { InventoryItem } from '../../types/items';
import { ItemType } from '../../types/items';
import { ItemIcon } from '../common/ItemIcon';

interface ItemCardProps {
  item: InventoryItem;
  onEquip?: () => void;
  onUnequip?: () => void;
  onUse?: () => void;
  onSelect: () => void;
}

const rarityColors = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800'
};

export function ItemCard({ item, onEquip, onUnequip, onUse, onSelect }: ItemCardProps) {
  console.log('[InventoryItemCard] Rendering item:', {
    item,
    imageUrl: item.imageUrl,
    effects: item.effects
  });

  return (
    <Card 
      sx={{ 
        position: 'relative',
        borderLeft: 3,
        borderColor: rarityColors[item.rarity],
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s'
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ItemIcon item={item} size={40} />
          </Box>
          <Typography variant="h6" component="div">
            {item.name}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {item.description}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
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

        <Box sx={{ display: 'flex', gap: 1 }}>
          {onEquip && !item.equipped && (
            <Button 
              variant="contained" 
              size="small" 
              onClick={onEquip}
              fullWidth
            >
              Equip
            </Button>
          )}
          {onUnequip && item.equipped && (
            <Button 
              variant="outlined" 
              size="small" 
              onClick={onUnequip}
              fullWidth
            >
              Unequip
            </Button>
          )}
          {onUse && (
            <Button 
              variant="contained" 
              size="small" 
              onClick={onUse}
              fullWidth
            >
              Use
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
} 