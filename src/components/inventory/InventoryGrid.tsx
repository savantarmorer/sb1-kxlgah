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
    // For avatars and titles views, don't apply additional filtering
    if (isAvatarView || showTitles) {
      return true;
    }

    // For regular items, apply category and rarity filters
    const matchesCategory = !selectedCategory || item.type === selectedCategory;
    const matchesRarity = !rarityFilter.length || rarityFilter.includes(item.rarity.toLowerCase());

    return matchesCategory && matchesRarity;
  });

  return (
    <Grid 
      container 
      spacing={3}
      sx={{
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        }
      }}
    >
      <AnimatePresence mode="popLayout">
        {filteredItems.map((item, index) => (
          <Grid 
            item 
            xs={12} 
            sm={6} 
            md={4} 
            lg={3} 
            key={item.id}
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { delay: index * 0.1 }
            }}
            exit={{ 
              opacity: 0, 
              y: -20,
              transition: { duration: 0.2 }
            }}
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
          </Grid>
        ))}
      </AnimatePresence>
    </Grid>
  );
} 