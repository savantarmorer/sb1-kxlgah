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
  Chip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { TitleService } from '../../services/titleService';
import type { DisplayTitle, TitleStats } from '../../types/titles';
import { useNotification } from '../../contexts/NotificationContext';

export default function TitleManager() {
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

  const handleEdit = (title: DisplayTitle) => {
    setSelectedTitle(title);
    setIsDialogOpen(true);
  };

  const handleDelete = async (title: DisplayTitle) => {
    if (!window.confirm('Are you sure you want to delete this title?')) return;

    try {
      await TitleService.deleteTitle(title.id);
      showSuccess('Title deleted successfully');
      loadTitles();
    } catch (error) {
      console.error('Error deleting title:', error);
      showError('Failed to delete title');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const titleData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseInt(formData.get('price') as string, 10),
      rarity: formData.get('rarity') as DisplayTitle['rarity'],
      requirements: {
        level: parseInt(formData.get('required_level') as string, 10) || 0
      },
      metadata: {
        color: formData.get('color') as string
      }
    };

    try {
      if (selectedTitle) {
        await TitleService.updateTitle(selectedTitle.id, titleData);
        showSuccess('Title updated successfully');
      } else {
        await TitleService.createTitle(titleData);
        showSuccess('Title created successfully');
      }
      
      setIsDialogOpen(false);
      loadTitles();
    } catch (error) {
      console.error('Error saving title:', error);
      showError('Failed to save title');
    }
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
                  <IconButton onClick={() => handleEdit(title)} color="primary">
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

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedTitle ? 'Edit Title' : 'Create New Title'}
          </DialogTitle>
          <DialogContent>
            <Box display="grid" gap={3} my={2}>
              <TextField
                name="name"
                label="Title Name"
                defaultValue={selectedTitle?.name}
                required
                fullWidth
              />
              
              <TextField
                name="description"
                label="Description"
                defaultValue={selectedTitle?.description}
                multiline
                rows={3}
                fullWidth
              />

              <TextField
                name="price"
                label="Price (coins)"
                type="number"
                defaultValue={selectedTitle?.price}
                required
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Rarity</InputLabel>
                <Select
                  name="rarity"
                  defaultValue={selectedTitle?.rarity || 'common'}
                  required
                >
                  <MenuItem value="common">Common</MenuItem>
                  <MenuItem value="rare">Rare</MenuItem>
                  <MenuItem value="epic">Epic</MenuItem>
                  <MenuItem value="legendary">Legendary</MenuItem>
                </Select>
              </FormControl>

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
                defaultValue={selectedTitle?.metadata?.color}
                placeholder="#000000"
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedTitle ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
} 