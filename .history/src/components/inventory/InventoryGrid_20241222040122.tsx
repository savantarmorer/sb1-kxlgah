import React from 'react';
import { Grid } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ItemCard } from './ItemCard';
import { InventoryItem } from '../../types/items';

interface InventoryGridProps {
  items: InventoryItem[];
  onEquip: (item: InventoryItem) => void;
  onUnequip: (item: InventoryItem) => void;
  onUse: (item: InventoryItem) => void;
  onSelect: (item: InventoryItem) => void;
}

export function InventoryGrid({ 
  items, 
  onEquip, 
  onUnequip, 
  onUse, 
  onSelect 
}: InventoryGridProps) {
  return (
    <Grid container spacing={3}>
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <ItemCard
                item={item}
                onEquip={() => onEquip(item)}
                onUnequip={() => onUnequip(item)}
                onUse={() => onUse(item)}
                onSelect={() => onSelect(item)}
              />
            </motion.div>
          </Grid>
        ))}
      </AnimatePresence>
    </Grid>
  );
} 