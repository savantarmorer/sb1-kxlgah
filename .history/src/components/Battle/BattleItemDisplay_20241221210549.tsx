import React, { useEffect } from 'react';
import { Box, IconButton, Badge, Tooltip } from '@mui/material';
import type { InventoryItem } from '../../types/items';

interface BattleItemDisplayProps {
  items: InventoryItem[];
  onUseItem: (item: InventoryItem) => void;
  disabled?: boolean;
}

export function BattleItemDisplay({ items, onUseItem, disabled }: BattleItemDisplayProps) {
  // Add logging for component props
  useEffect(() => {
    console.log('[BattleItemDisplay] Rendering with props:', {
      itemCount: items.length,
      disabled,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        effects: item.effects
      }))
    });
  }, [items, disabled]);

  if (!items.length) {
    console.log('[BattleItemDisplay] No items to display');
    return null;
  }

  const handleItemClick = (item: InventoryItem) => {
    console.log('[BattleItemDisplay] Item clicked:', {
      id: item.id,
      name: item.name,
      disabled
    });
    
    if (disabled) {
      console.log('[BattleItemDisplay] Item use blocked - component disabled');
      return;
    }
    
    onUseItem(item);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {items.map((item) => (
        <Tooltip 
          key={item.id}
          title={`${item.name} (${item.description})`}
          placement="left"
        >
          <span>
            <IconButton
              onClick={() => handleItemClick(item)}
              disabled={disabled || !item.quantity}
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)'
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              <Badge
                badgeContent={item.quantity}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: disabled ? 'rgba(255, 255, 255, 0.3)' : undefined
                  }
                }}
              >
                {item.icon}
              </Badge>
            </IconButton>
          </span>
        </Tooltip>
      ))}
    </Box>
  );
} 