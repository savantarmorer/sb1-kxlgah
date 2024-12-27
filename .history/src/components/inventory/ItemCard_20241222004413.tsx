import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import { Shield, Zap, Crown, Info, Star, Package, Sparkles } from 'lucide-react';
import type { InventoryItem } from '../../types/items';
import { ItemType } from '../../types/items';

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
          <ItemIcon size={20} color={rarityColors[item.rarity]} />
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {onEquip && (
            <Tooltip title="Equip">
              <IconButton onClick={onEquip} size="small">
                <Shield size={18} />
              </IconButton>
            </Tooltip>
          )}
          {onUnequip && (
            <Tooltip title="Unequip">
              <IconButton onClick={onUnequip} size="small" color="error">
                <Shield size={18} />
              </IconButton>
            </Tooltip>
          )}
          {onUse && (
            <Tooltip title="Use">
              <IconButton onClick={onUse} size="small" color="primary">
                <Zap size={18} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Details">
            <IconButton onClick={onSelect} size="small">
              <Info size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
} 