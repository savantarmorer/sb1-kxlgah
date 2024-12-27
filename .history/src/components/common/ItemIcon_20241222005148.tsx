import React, { useState } from 'react';
import type { InventoryItem, GameItem } from '../../types/items';
import { Box } from '@mui/material';
import { Sparkles, Star, Zap, Package } from 'lucide-react';

interface ItemIconProps {
  item: InventoryItem | GameItem;
  size?: number;
}

const DEFAULT_ICON_SIZE = 28;

const isInventoryItem = (item: InventoryItem | GameItem): item is InventoryItem => {
  return 'quantity' in item;
};

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
          return <Sparkles size={size} className="text-green-500" />;
        case 'battle_boost':
          return <Star size={size} className="text-purple-500" />;
        default:
          return <Package size={size} className="text-gray-500" />;
      }
    }

    // Default to package icon
    return <Package size={size} className="text-indigo-500" />;
  };

  const getImageUrl = (imageUrl: string | undefined, itemId: string): string => {
    // First try to get icon from effects metadata
    if (Array.isArray(item.effects)) {
      const iconFromEffects = item.effects.find(effect => effect.metadata?.icon)?.metadata?.icon;
      if (iconFromEffects) {
        if (iconFromEffects.startsWith('custom:')) {
          return iconFromEffects.replace('custom:', '');
        }
        return iconFromEffects;
      }
    }

    // Then try the provided imageUrl
    if (!imageUrl) return `/images/items/${itemId}.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/images/')) return imageUrl;
    if (imageUrl.startsWith('custom:')) return imageUrl.replace('custom:', '');
    return `/images/items/${imageUrl}`;
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
    <Box 
      sx={{ 
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {item.imageUrl ? (
        <img
          src={getImageUrl(item.imageUrl, item.id)}
          alt={item.name}
          onError={handleError}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      ) : (
        getFallbackIcon()
      )}
    </Box>
  );
} 