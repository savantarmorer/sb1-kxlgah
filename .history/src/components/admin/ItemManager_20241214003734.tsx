import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Button,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { supabase } from '../../lib/supabase.ts';
import { useNotification } from '../../contexts/NotificationContext';
import { CreateItemDialog } from './CreateItemDialog';
import { ITEM_ICONS } from './itemIconDefinitions';
import { Edit, Delete } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity: string;
  cost: number;
  effects: any[];
  requirements: any[];
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  icon: string;
}

export function ItemManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
      showError('Failed to load items');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showSuccess('Item deleted successfully');
      loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      showError('Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (item: Item) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('items')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);

      if (error) throw error;

      showSuccess(`Item ${item.is_active ? 'deactivated' : 'activated'} successfully`);
      loadItems();
    } catch (error) {
      console.error('Error updating item:', error);
      showError('Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'warning';
      case 'epic': return 'secondary';
      case 'rare': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Item Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateDialog(true)}
          disabled={loading}
        >
          Add Item
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Rarity</TableCell>
              <TableCell>Cost</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {item.icon && (
                      item.icon.startsWith('custom:') ? (
                        <img 
                          src={item.icon.replace('custom:', '')} 
                          alt={item.name}
                          style={{ width: 24, height: 24 }} 
                        />
                      ) : (
                        <div className="w-6 h-6 flex items-center justify-center">
                          {item.icon}
                        </div>
                      )
                    )}
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={item.type} />
                </TableCell>
                <TableCell>
                  <Chip
                    label={item.rarity}
                    color={getRarityColor(item.rarity)}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingCartIcon fontSize="small" />
                    {item.cost}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={item.is_active ? 'Active' : 'Inactive'}
                    color={item.is_active ? 'success' : 'error'}
                    onClick={() => handleToggleActive(item)}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => setEditingItem(item)}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(item.id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateItemDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onItemCreated={loadItems}
      />

      {/* TODO: Add EditItemDialog component */}
    </Box>
  );
}