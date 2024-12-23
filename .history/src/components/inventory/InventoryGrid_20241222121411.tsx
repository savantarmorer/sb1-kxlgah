import React from 'react';
import { Box, Grid } from '@mui/material';
import { ItemCard } from './ItemCard';
import type { InventoryItem } from '../../types/items';

interface InventoryGridProps {
  items: any[];
  onEquip?: (item: any) => void;
  onUnequip?: (item: any) => void;
  onUse?: (item: any) => void;
  onSelect?: (item: any) => void;
  isAvatarView?: boolean;
}

export function InventoryGrid({ items, onEquip, onUnequip, onUse, onSelect, isAvatarView }: InventoryGridProps) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            <ItemCard
              item={item}
              onEquip={onEquip}
              onUnequip={onUnequip}
              onUse={onUse}
              onSelect={onSelect}
              isAvatarView={isAvatarView}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
} 