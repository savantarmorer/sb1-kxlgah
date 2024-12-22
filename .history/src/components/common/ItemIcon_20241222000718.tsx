import React, { useState } from 'react';
import type { InventoryItem } from '../../types/items';
import { Box } from '@mui/material';
import { Vial, Star, Shield, Zap, Crown, Package } from 'lucide-react';

interface ItemIconProps {
  item: InventoryItem;
  size?: number;
}

const DEFAULT_ICON_SIZE = 28;

export function ItemIcon({ item, size = DEFAULT_ICON_SIZE }: ItemIconProps): JSX.Element {
  const [imageError, setImageError] = useState(false);

  const getFallbackIcon = () => {
    // First try to get icon from effects metadata
    if (Array.isArray(item.effects)) {
      const iconFromEffects = item.effects.find(effect => effect.metadata?.icon)?.metadata?.icon;
      if (iconFromEffects) return iconFromEffects;
    }

    // Then try to determine icon based on item type or effects
    if (Array.isArray(item.effects)) {
      const effectType = item.effects[0]?.type;
      switch (effectType) {
        case 'eliminate_wrong_answer':
          return <Star size={size} className="text-yellow-500" />;
        case 'battle_hint':
          return <Zap size={size} className="text-blue-500" />;
        case 'time_bonus':
          return <Shield size={size} className="text-green-500" />;
        case 'battle_boost':
          return <Crown size={size} className="text-purple-500" />;
        default:
          return <Package size={size} className="text-gray-500" />;
      }
    }

    // Default to vial icon
    return <Vial size={size} className="text-indigo-500" />;
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.warn('[ItemIcon] Failed to load image:', {
      itemId: item.id,
      imageUrl: item.imageUrl,
      fallbackUrl: `/images/items/${item.id}.png`
    });
    setImageError(true);
  };

  if (imageError) {
    return (
      <Box 
        sx={{ 
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {getFallbackIcon()}
      </Box>
    );
  }

  return (
    <img 
      src={item.imageUrl?.startsWith('http') 
        ? item.imageUrl 
        : `/images/items/${item.imageUrl || item.id}.png`}
      alt={item.name}
      style={{ width: size, height: size, objectFit: 'contain' }}
      onError={handleError}
    />
  );
} 