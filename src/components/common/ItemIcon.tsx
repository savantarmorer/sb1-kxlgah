import React from 'react';
import type { InventoryItem } from '../../types/items';

interface ItemIconProps {
  item: InventoryItem;
}

export function ItemIcon({ item }: ItemIconProps): JSX.Element {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.src = Array.isArray(item.effects) 
      ? item.effects.find(effect => effect.metadata?.icon)?.metadata?.icon || '🧪'
      : '🧪';
  };

  return (
    <img 
      src={item.imageUrl || `/images/items/${item.id}.png`}
      alt={item.name}
      style={{ width: 28, height: 28 }}
      onError={handleError}
    />
  );
} 