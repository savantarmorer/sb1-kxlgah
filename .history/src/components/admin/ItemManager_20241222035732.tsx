import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import { CreateItemDialog } from './CreateItemDialog';
import { ItemEditor } from './ItemEditor';
import { useItemManagement } from '../../hooks/useItemManagement';
import { InventoryItem, ItemType } from '../../types/items';
import { ItemCard } from '../inventory/ItemCard';
import { ItemCard3D } from '../inventory/ItemCard3D';
import Button from '../Button';

export function ItemManager() {
  const { items, loading, error, createItem, updateItem, deleteItem } = useItemManagement();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<'normal' | '3d'>('normal');
  const [filterType, setFilterType] = useState<ItemType | 'all'>('all');

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item);
  };

  const handleCloseEditor = () => {
    setSelectedItem(null);
  };

  const handleCreateItem = async (newItem: Partial<InventoryItem>) => {
    await createItem(newItem);
    setCreateDialogOpen(false);
  };

  const handleUpdateItem = async (updatedItem: InventoryItem) => {
    await updateItem(updatedItem);
    setSelectedItem(null);
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteItem(itemId);
    setSelectedItem(null);
  };

  const filteredItems = filterType === 'all' 
    ? items 
    : items.filter(item => item.type === filterType);

  if (loading) {
    return <Typography>Loading items...</Typography>;
  }

  if (error) {
    return <Typography color="error">Error loading items: {error}</Typography>;
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Item Management</Typography>
        <Button
          variant="primary"
          onClick={() => setCreateDialogOpen(true)}
        >
          Create New Item
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Type</InputLabel>
          <Select
            value={filterType}
            label="Filter by Type"
            onChange={(e) => setFilterType(e.target.value as ItemType | 'all')}
          >
            <MenuItem value="all">All Types</MenuItem>
            {Object.values(ItemType).map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={displayMode === '3d'}
              onChange={(e) => setDisplayMode(e.target.checked ? '3d' : 'normal')}
            />
          }
          label="3D Display"
        />
      </Box>

      <Grid container spacing={3}>
        {filteredItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            {displayMode === '3d' ? (
              <ItemCard3D
                item={item}
                onClick={() => handleItemClick(item)}
              />
            ) : (
              <ItemCard
                item={item}
                onSelect={() => handleItemClick(item)}
              />
            )}
          </Grid>
        ))}
      </Grid>

      <CreateItemDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateItem}
      />

      {selectedItem && (
        <ItemEditor
          item={selectedItem}
          onClose={handleCloseEditor}
          onSave={handleUpdateItem}
          onDelete={handleDeleteItem}
        />
      )}
    </Box>
  );
}