import React from 'react';
import { Grid } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ItemCard } from './ItemCard';
import { ItemCard3D } from './ItemCard3D';
import type { InventoryItem } from '../../types/items';
import { ItemType } from '../../types/items';

interface InventoryGridProps {
  items: InventoryItem[] | any[];
  onEquip?: (item: any) => void;
  onUnequip?: (item: any) => void;
  onUse?: (item: any) => void;
  onSelect?: (item: any) => void;
  isAvatarView?: boolean;
  showTitles?: boolean;
  selectedCategory?: ItemType | null;
  rarityFilter?: string[];
}

export function InventoryGrid({ 
  items, 
  onEquip, 
  onUnequip, 
  onUse, 
  onSelect, 
  isAvatarView,
  showTitles,
  selectedCategory,
  rarityFilter = []
}: InventoryGridProps) {
  const filteredItems = items.filter(item => {
    // Avatar view - only show avatars
    if (isAvatarView) {
      return true; // Avatars are already filtered in the parent component
    }

    // Title view - only show titles
    if (showTitles) {
      return item.type === ItemType.COSMETIC;
    }

    // Regular items view - show everything except titles and avatars
    const isRegularItem = item.type !== ItemType.COSMETIC && item.type !== ItemType.AVATAR;
    const matchesCategory = !selectedCategory || item.type === selectedCategory;
    const matchesRarity = !rarityFilter.length || rarityFilter.includes(item.rarity.toLowerCase());

    return isRegularItem && matchesCategory && matchesRarity;
  });

  return (
    <Grid container spacing={3}>
      <AnimatePresence mode="popLayout">
        {filteredItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              {item.metadata?.display_mode === '3d' ? (
                <ItemCard3D
                  item={item}
                  onClick={() => onSelect?.(item)}
                />
              ) : (
                <ItemCard
                  item={item}
                  onEquip={onEquip}
                  onUnequip={onUnequip}
                  onUse={onUse}
                  onSelect={onSelect}
                  isAvatarView={isAvatarView}
                />
              )}
            </motion.div>
          </Grid>
        ))}
      </AnimatePresence>
    </Grid>
  );
} 