import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Chip,
  FormControlLabel,
  Switch,
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { TitleService } from '../../services/titleService';
import type { DisplayTitle, TitleStats } from '../../types/titles';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase';

interface TitleManagerProps {
  onClose: () => void;
}

export default function TitleManager({ onClose }: TitleManagerProps) {
  const { showSuccess, showError } = useNotification();
  const [titles, setTitles] = useState<DisplayTitle[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<DisplayTitle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [titleStats, setTitleStats] = useState<Record<string, TitleStats>>({});

  useEffect(() => {
    loadTitles();
  }, []);

  const loadTitles = async () => {
    try {
      setLoading(true);
      const data = await TitleService.getAllTitles();
      setTitles(data);

      // Load stats for each title
      const stats: Record<string, TitleStats> = {};
      await Promise.all(
        data.map(async (title) => {
          stats[title.id] = await TitleService.getTitleStats(title.id);
        })
      );
      setTitleStats(stats);
    } catch (error) {
      console.error('Error loading titles:', error);
      showError('Failed to load titles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedTitle(null);
    setIsDialogOpen(true);
  };

  const handleEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTitle) return;

    const formData = new FormData(event.currentTarget);

    try {
      setLoading(true);

      // Update only the fields that exist in the display_titles table
      const titleData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: parseInt(formData.get('price') as string, 10),
        rarity: formData.get('rarity') as DisplayTitle['rarity'],
        is_active: true,
        requirements: {
          level: parseInt(formData.get('required_level') as string, 10) || 0
        },
        metadata: {
          color: formData.get('color') as string
        }
      };

      // Update the title
      await TitleService.updateTitle(selectedTitle.id, titleData);

      // Update the shop item
      const { error: shopError } = await supabase
        .from('shop_items')
        .update({
          price: titleData.price,
          is_featured: formData.get('is_featured') === 'true'
        })
        .eq('item_id', selectedTitle.id);

      if (shopError) throw shopError;

      showSuccess('Title updated successfully');
      setIsDialogOpen(false);
      loadTitles();
    } catch (error: any) {
      console.error('Error updating title:', error);
      showError(error.message || 'Failed to update title');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (title: DisplayTitle) => {
    if (!window.confirm('Are you sure you want to delete this title?')) return;

    try {
      setLoading(true);

      // Delete from shop_items first (foreign key constraint)
      await supabase
        .from('shop_items')
        .delete()
        .eq('item_id', title.id);

      // Then delete the title
      await TitleService.deleteTitle(title.id);

      showSuccess('Title deleted successfully');
      loadTitles();
    } catch (error: any) {
      console.error('Error deleting title:', error);
      showError(error.message || 'Failed to delete title');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      setLoading(true);

      // Create title data with only valid fields for display_titles table
      const titleData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: parseInt(formData.get('price') as string, 10),
        rarity: formData.get('rarity') as DisplayTitle['rarity'],
        is_active: true,
        requirements: {
          level: parseInt(formData.get('required_level') as string, 10) || 0
        },
        metadata: {
          color: formData.get('color') as string
        }
      };

      // Create the title in the titles table
      const title = await TitleService.createTitle(titleData);

      // Add the title to the shop_items table
      const { error: shopError } = await supabase
        .from('shop_items')
        .insert({
          item_id: title.id,
          price: titleData.price,
          is_available: true,
          is_featured: formData.get('is_featured') === 'true',
          stock: null, // Titles don't have stock
          discount_price: null,
          discount_ends_at: null
        });

      if (shopError) throw shopError;

      showSuccess('Title created and added to shop successfully');
      setIsDialogOpen(false);
      loadTitles();
    } catch (error: any) {
      console.error('Error creating title:', error);
      showError(error.message || 'Failed to create title');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (title: DisplayTitle) => {
    setSelectedTitle(title);
    setIsDialogOpen(true);
  };

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">Title Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Create New Title
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell><strong>Price</strong></TableCell>
              <TableCell><strong>Rarity</strong></TableCell>
              <TableCell><strong>Stats</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {titles.map((title) => (
              <TableRow key={title.id}>
                <TableCell>{title.name}</TableCell>
                <TableCell>{title.description}</TableCell>
                <TableCell>{title.price} coins</TableCell>
                <TableCell>
                  <Chip
                    label={title.rarity}
                    color={
                      title.rarity === 'legendary' ? 'error' :
                      title.rarity === 'epic' ? 'warning' :
                      title.rarity === 'rare' ? 'info' : 'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  {titleStats[title.id] && (
                    <Box>
                      <Typography variant="caption" display="block">
                        Purchases: {titleStats[title.id].total_purchases}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Revenue: {titleStats[title.id].revenue_generated} coins
                      </Typography>
                      <Typography variant="caption" display="block">
                        Active Users: {titleStats[title.id].active_users}
                      </Typography>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditClick(title)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(title)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedTitle(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTitle ? 'Edit Title' : 'Create New Title'}
        </DialogTitle>
        <DialogContent>
          <form onSubmit={selectedTitle ? handleEdit : handleSubmit} className="space-y-4 mt-4">
            <TextField
              name="name"
              label="Title Name"
              defaultValue={selectedTitle?.name || ''}
              fullWidth
              required
            />
            <TextField
              name="description"
              label="Description"
              defaultValue={selectedTitle?.description || ''}
              fullWidth
              multiline
              rows={2}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                name="price"
                label="Price (coins)"
                type="number"
                defaultValue={selectedTitle?.price || 0}
                fullWidth
                required
              />
              <FormControl fullWidth required>
                <InputLabel>Rarity</InputLabel>
                <Select
                  name="rarity"
                  defaultValue={selectedTitle?.rarity || 'common'}
                  label="Rarity"
                >
                  <MenuItem value="common">Common</MenuItem>
                  <MenuItem value="rare">Rare</MenuItem>
                  <MenuItem value="epic">Epic</MenuItem>
                  <MenuItem value="legendary">Legendary</MenuItem>
                </Select>
              </FormControl>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                name="required_level"
                label="Required Level"
                type="number"
                defaultValue={selectedTitle?.requirements?.level || 0}
                fullWidth
              />
              <TextField
                name="color"
                label="Color (hex)"
                defaultValue={selectedTitle?.metadata?.color || ''}
                fullWidth
              />
            </div>
            <FormControlLabel
              control={
                <Switch
                  name="is_featured"
                  defaultChecked={selectedTitle?.is_featured || false}
                />
              }
              label="Featured in Shop"
            />
            <DialogActions>
              <Button
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedTitle(null);
                }}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : selectedTitle ? (
                  'Update Title'
                ) : (
                  'Create Title'
                )}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
} 