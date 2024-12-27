import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Grid,
  SelectChangeEvent,
  Typography,
} from '@mui/material';
import { supabase } from '../../lib/supabase.ts';
import { useNotification } from '../../contexts/NotificationContext';
import { ItemIconSelector } from './ItemIconSelector';
import { ItemEffect, ItemType } from '../../types/items';
import { ItemEffectsManager } from './ItemEffectsManager';

interface CreateItemDialogProps {
  open: boolean;
  onClose: () => void;
  onItemCreated: () => void;
}

interface ItemFormData {
  name: string;
  description: string;
  type: ItemType;
  rarity: string;
  cost: number;
  effects: ItemEffect[];
  requirements: any[];
  metadata: Record<string, any>;
  is_active: boolean;
  icon: string;
  icon_color: string;
}

const initialFormData: ItemFormData = {
  name: '',
  description: '',
  type: ItemType.CONSUMABLE,
  rarity: 'common',
  cost: 0,
  effects: [],
  requirements: [],
  metadata: {},
  is_active: true,
  icon: 'default_icon',
  icon_color: '#000000'
};

export const CreateItemDialog: React.FC<CreateItemDialogProps> = ({
  open,
  onClose,
  onItemCreated
}): JSX.Element => {
  const [formData, setFormData] = useState<ItemFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const handleIconChange = (iconName: string, color?: string) => {
    setFormData(prev => ({
      ...prev,
      icon: iconName,
      icon_color: color || prev.icon_color
    }));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cost' ? Number(value) : value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Prepare the data with proper size limits
      const preparedData = {
        name: formData.name.slice(0, 255), // Limit name length
        description: formData.description.slice(0, 1000), // Limit description length
        type: formData.type,
        rarity: formData.rarity,
        cost: formData.cost,
        effects: formData.effects.slice(0, 10), // Limit number of effects
        requirements: formData.requirements.slice(0, 10), // Limit number of requirements
        metadata: {}, // Start with empty metadata
        is_active: true,
        icon: formData.icon,
        icon_color: formData.icon_color,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Handle custom uploaded icons (base64)
      if (formData.icon.startsWith('data:')) {
        // Store the base64 icon in metadata to avoid index size issues
        preparedData.metadata = {
          ...formData.metadata,
          customIcon: formData.icon
        };
        // Use a placeholder for the main icon field
        preparedData.icon = 'custom:uploaded';
      }

      // Only add additional metadata if there's space
      if (Object.keys(formData.metadata).length > 0) {
        const metadataWithIcon = {
          ...preparedData.metadata,
          ...formData.metadata
        };
        const metadataStr = JSON.stringify(metadataWithIcon);
        if (metadataStr.length <= 8000) { // Increased limit since we need space for icons
          preparedData.metadata = metadataWithIcon;
        }
      }

      const { error } = await supabase
        .from('items')
        .insert(preparedData);

      if (error) throw error;

      showSuccess('Item created successfully');
      onItemCreated?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating item:', error);
      showError(error.message || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Item</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleTextChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleTextChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleSelectChange}
                label="Type"
              >
                {Object.values(ItemType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Rarity</InputLabel>
              <Select
                name="rarity"
                value={formData.rarity}
                onChange={handleSelectChange}
                label="Rarity"
              >
                <MenuItem value="common">Common</MenuItem>
                <MenuItem value="rare">Rare</MenuItem>
                <MenuItem value="epic">Epic</MenuItem>
                <MenuItem value="legendary">Legendary</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Cost"
              name="cost"
              type="number"
              value={formData.cost}
              onChange={handleTextChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography>Icon</Typography>
              <ItemIconSelector
                value={formData.icon}
                onChange={handleIconChange}
                initialColor={formData.icon_color}
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name || !formData.description}
        >
          Create Item
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 