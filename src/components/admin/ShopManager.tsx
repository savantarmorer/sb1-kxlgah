import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Typography,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';
import { Edit, Delete, Star, ShoppingBag } from 'lucide-react';
import { supabase } from '../../lib/supabase.ts';
import { useNotification } from '../../contexts/NotificationContext';
import { GameItem } from '../../types/items';
import { DateTimePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import { PostgrestError, PostgrestResponse } from '@supabase/supabase-js';
import { useGame } from '../../contexts/GameContext';
import { ShopManagerProps } from '../../types/admin';

interface ShopItemResponse {
  id: string;
  item_id: string;
  price: number;
  discount_price: number | null;
  discount_ends_at: string | null;
  stock: number | null;
  is_featured: boolean;
  is_available: boolean;
  item: GameItem;
  created_at: string;
  updated_at: string;
}

const formatDateTime = (dateTime: DateTime | null | undefined): string => {
  if (!dateTime) return '';
  return dateTime.toLocaleString(DateTime.DATETIME_SHORT);
};

export function ShopManager({ onItemsUpdate }: ShopManagerProps) {
  const [items, setItems] = useState<GameItem[]>([]);
  const [shopItems, setShopItems] = useState<ShopItemResponse[]>([]);
  const [selectedItem, setSelectedItem] = useState<ShopItemResponse | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();
  const { state, dispatch } = useGame();

  const [formData, setFormData] = useState({
    item_id: '',
    price: 0,
    discount_price: 0,
    discount_ends_at: null as DateTime | null,
    stock: null as number | null,
    is_featured: false,
    is_available: true,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          loadItems(),
          loadShopItems()
        ]);
      } catch (error) {
        console.error('Error loading shop data:', error);
        showError('Failed to load shop data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const loadItems = async () => {
    const { data, error }: { 
      data: GameItem[] | null; 
      error: PostgrestError | null;
    } = await supabase
      .from('items')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      showError('Failed to load items');
      return;
    }
    
    setItems(data || []);
  };

  const loadShopItems = async () => {
    const { data, error }: {
      data: ShopItemResponse[] | null;
      error: PostgrestError | null;
    } = await supabase
      .from('shop_items')
      .select(`
        *,
        item:items (
          id,
          name,
          description,
          type,
          rarity,
          effects,
          metadata,
          icon,
          icon_color
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      showError('Failed to load shop items');
      return;
    }
    
    setShopItems(data || []);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const { data, error } = selectedItem
        ? await supabase
            .from('shop_items')
            .update({
              item_id: formData.item_id,
              price: formData.price,
              discount_price: formData.discount_price || null,
              discount_ends_at: formData.discount_ends_at?.toISO() || null,
              stock: formData.stock,
              is_featured: formData.is_featured,
              is_available: true
            })
            .eq('id', selectedItem.id)
            .select('*, item:items(*)')
        : await supabase
            .from('shop_items')
            .insert({
              item_id: formData.item_id,
              price: formData.price,
              discount_price: formData.discount_price || null,
              discount_ends_at: formData.discount_ends_at?.toISO() || null,
              stock: formData.stock,
              is_featured: formData.is_featured,
              is_available: true
            })
            .select('*, item:items(*)');

      if (error) throw error;

      showSuccess(`Shop item ${selectedItem ? 'updated' : 'added'} successfully`);
      
      setSelectedItem(null);
      setFormData({
        item_id: '',
        price: 0,
        discount_price: 0,
        discount_ends_at: null,
        stock: null,
        is_featured: false,
        is_available: true,
      });
      
      await loadShopItems();
      if (onItemsUpdate) {
        await onItemsUpdate();
      }
      setShowDialog(false);
    } catch (error: PostgrestError | any) {
      console.error('Error saving shop item:', error);
      showError(error.message || 'Failed to save shop item');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (shopItem: ShopItemResponse) => {
    setSelectedItem(shopItem);
    setFormData({
      item_id: shopItem.item_id,
      price: shopItem.price,
      discount_price: shopItem.discount_price || 0,
      discount_ends_at: shopItem.discount_ends_at ? DateTime.fromISO(shopItem.discount_ends_at) : null,
      stock: shopItem.stock || null,
      is_featured: shopItem.is_featured,
      is_available: shopItem.is_available,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('shop_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showSuccess('Shop item removed successfully');
      await loadShopItems();
      if (onItemsUpdate) {
        await onItemsUpdate();
      }
    } catch (error) {
      console.error('Error deleting shop item:', error);
      showError('Failed to delete shop item');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailable = async (shopItem: ShopItemResponse) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('shop_items')
        .update({ is_available: !shopItem.is_available })
        .eq('id', shopItem.id);
      
      if (error) throw error;
      
      showSuccess(`Item ${shopItem.is_available ? 'hidden from' : 'shown in'} shop`);
      await loadShopItems();
      if (onItemsUpdate) {
        await onItemsUpdate();
      }
    } catch (error: any) {
      console.error('Error updating item availability:', error);
      showError(error.message || 'Failed to update item availability');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (shopItem: ShopItemResponse) => {
    try {
      setLoading(true);
      
      if (!state.user) {
        showError('User not logged in');
        return;
      }
      
      const currentPrice = shopItem.discount_price && new Date(shopItem.discount_ends_at!) > new Date() 
        ? shopItem.discount_price 
        : shopItem.price;
        
      if (state.user.coins < currentPrice) {
        showError('Not enough coins');
        return;
      }

      // Check stock
      if (shopItem.stock !== null && shopItem.stock <= 0) {
        showError('Item is out of stock');
        return;
      }

      const { error: purchaseError } = await supabase.rpc('purchase_shop_item', {
        p_shop_item_id: shopItem.id,
        p_user_id: state.user.id,
        p_quantity: 1
      });

      if (purchaseError) throw purchaseError;

      // Update local state
      dispatch({
        type: 'UPDATE_USER_PROFILE',
        payload: {
          user_inventory: [
            ...(state.user.user_inventory || []),
            {
              id: shopItem.item.id,
              name: shopItem.item.name,
              description: shopItem.item.description,
              type: shopItem.item.type,
              rarity: shopItem.item.rarity,
              equipped: false,
              quantity: 1,
              icon: shopItem.item.icon || '',
              effects: shopItem.item.effects,
              is_active: true,
              acquired_at: new Date().toISOString()
            }
          ]
        }
      });

      dispatch({
        type: 'ADD_COINS',
        payload: { amount: -currentPrice, source: 'shop_purchase' }
      });

      showSuccess('Item purchased successfully!');
      await loadShopItems();
      if (onItemsUpdate) {
        await onItemsUpdate();
      }
    } catch (error: any) {
      console.error('Error purchasing item:', error);
      showError(error.message || 'Failed to purchase item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Shop Management</Typography>
        <Button
          variant="contained"
          startIcon={<ShoppingBag />}
          onClick={() => setShowDialog(true)}
        >
          Add Shop Item
        </Button>
      </Box>

      <TableContainer component={Paper}>
        {isLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        ) : shopItems.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No items in shop
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shopItems.map((shopItem) => (
                <TableRow key={shopItem.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {shopItem.is_featured && (
                        <Star className="text-yellow-500" size={16} />
                      )}
                      <div>
                        <Typography variant="subtitle2">
                          {shopItem.item?.name || 'Loading...'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {shopItem.item?.description || ''}
                        </Typography>
                      </div>
                    </Box>
                  </TableCell>
                  <TableCell>{shopItem.price}</TableCell>
                  <TableCell>
                    {shopItem.discount_price ? (
                      <Box>
                        <Typography color="error">{shopItem.discount_price}</Typography>
                        <Typography variant="caption">
                          Until {formatDateTime(shopItem.discount_ends_at ? DateTime.fromISO(shopItem.discount_ends_at) : null)}
                        </Typography>
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{shopItem.stock || 'Unlimited'}</TableCell>
                  <TableCell>
                    <Switch
                      checked={shopItem.is_available}
                      onChange={() => handleToggleAvailable(shopItem)}
                      disabled={loading}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      disabled={loading || 
                        !shopItem.is_available || 
                        (shopItem.stock !== null && shopItem.stock <= 0)}
                      onClick={() => handlePurchase(shopItem)}
                      sx={{ mr: 1 }}
                    >
                      Buy ({shopItem.discount_price && new Date(shopItem.discount_ends_at!) > new Date() 
                        ? shopItem.discount_price 
                        : shopItem.price} coins)
                    </Button>
                    <IconButton onClick={() => handleEdit(shopItem)}>
                      <Edit size={20} />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(shopItem.id)} color="error">
                      <Delete size={20} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedItem ? 'Edit Shop Item' : 'Add Shop Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Item</InputLabel>
                <Select
                  value={formData.item_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, item_id: e.target.value }))}
                  label="Item"
                >
                  {items.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Discount Price"
                type="number"
                value={formData.discount_price}
                onChange={(e) => setFormData(prev => ({ ...prev, discount_price: Number(e.target.value) }))}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Discount Ends At"
                value={formData.discount_ends_at}
                onChange={(date: DateTime | null) => setFormData(prev => ({ 
                  ...prev, 
                  discount_ends_at: date 
                }))}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stock (empty for unlimited)"
                type="number"
                value={formData.stock || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, stock: Number(e.target.value) || null }))}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  />
                }
                label="Featured Item"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.item_id || !formData.price}
          >
            {selectedItem ? 'Update' : 'Add'} Shop Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
/**
 * ShopManager Component
 * 
 * Purpose:
 * - Manages shop items and their properties
 * - Handles item pricing and availability
 * 
 * Dependencies:
 * - useGame: For accessing item state
 * - useAdminActions: For item CRUD operations
 * 
 * Used by:
 * - AdminDashboard component
 * 
 * State management:
 * - Local state for shop items
 * - Global state sync through GameContext
 * 
 * Database interactions:
 * - Creates/updates items in Supabase
 * - Syncs with GameContext state
 */
