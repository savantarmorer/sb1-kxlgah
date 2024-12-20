import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Grid, 
  Typography,
  TextField,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Search, Filter, Info } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { ItemCard } from './ItemCard';
import { ItemDetails } from './ItemDetails';
import { FilterDrawer } from './FilterDrawer';
import type { GameItem, ItemType } from '../../types/items';

const CATEGORIES = ['All', 'Equipment', 'Consumable', 'Cosmetic'];

export function InventoryDashboard() {
  const { inventory, equipItem, unequipItem, useItem } = useInventory();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null);
  const [rarityFilter, setRarityFilter] = useState<string[]>([]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || item.type === category;
      const matchesRarity = rarityFilter.length === 0 || rarityFilter.includes(item.rarity);
      return matchesSearch && matchesCategory && matchesRarity;
    });
  }, [inventory, search, category, rarityFilter]);

  // Group items by equipped status
  const { equippedItems, unequippedItems } = useMemo(() => {
    return {
      equippedItems: filteredItems.filter(item => item.equipped),
      unequippedItems: filteredItems.filter(item => !item.equipped)
    };
  }, [filteredItems]);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Inventory
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search size={20} />,
            }}
            sx={{ flex: 1 }}
          />
          <IconButton onClick={() => setShowFilters(true)}>
            <Filter />
          </IconButton>
        </Box>
      </Box>

      {/* Category Tabs */}
      <Tabs
        value={category}
        onChange={(_, newValue) => setCategory(newValue)}
        sx={{ mb: 4 }}
      >
        {CATEGORIES.map(cat => (
          <Tab 
            key={cat} 
            label={cat} 
            value={cat}
            sx={{ 
              textTransform: 'none',
              fontWeight: 'medium' 
            }}
          />
        ))}
      </Tabs>

      {/* Equipped Items Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Equipped Items ({equippedItems.length})
        </Typography>
        <Grid container spacing={2}>
          <AnimatePresence>
            {equippedItems.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <ItemCard
                    item={item}
                    onUnequip={() => unequipItem(item)}
                    onSelect={() => setSelectedItem(item)}
                  />
                </motion.div>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      </Box>

      {/* Inventory Items Section */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Available Items ({unequippedItems.length})
        </Typography>
        <Grid container spacing={2}>
          <AnimatePresence>
            {unequippedItems.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <ItemCard
                    item={item}
                    onEquip={() => equipItem(item)}
                    onUse={item.type === ItemType.CONSUMABLE ? () => useItem(item) : undefined}
                    onSelect={() => setSelectedItem(item)}
                  />
                </motion.div>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      </Box>

      {/* Filter Drawer */}
      <FilterDrawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        rarityFilter={rarityFilter}
        onRarityChange={setRarityFilter}
      />

      {/* Item Details Dialog */}
      <ItemDetails
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </Box>
  );
} 