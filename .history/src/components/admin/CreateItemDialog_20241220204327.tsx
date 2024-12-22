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
  Tabs,
  Tab,
} from '@mui/material';
import { supabase } from '../../lib/supabase.ts';
import { useNotification } from '../../contexts/NotificationContext';
import { ItemIconSelector } from './ItemIconSelector';
import { ItemEffect, ItemType } from '../../types/items';
import { ItemEffectsManager } from './ItemEffectsManager';
import * as Icons from '@mui/icons-material';

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

// Add icon categories
const ITEM_ICONS = {
  weapons: [
    { name: 'Sword', icon: Icons.GavelOutlined },
    { name: 'Shield', icon: Icons.ShieldOutlined },
    { name: 'Bow', icon: Icons.GpsFixedOutlined },
    { name: 'Staff', icon: Icons.AutoFixHighOutlined },
    { name: 'Axe', icon: Icons.HandymanOutlined },
    { name: 'Dagger', icon: Icons.ContentCutOutlined },
  ],
  armor: [
    { name: 'Helmet', icon: Icons.Face3Outlined },
    { name: 'Chestplate', icon: Icons.SecurityOutlined },
    { name: 'Boots', icon: Icons.DirectionsRunOutlined },
    { name: 'Gloves', icon: Icons.PanToolOutlined },
    { name: 'Ring', icon: Icons.CircleOutlined },
    { name: 'Amulet', icon: Icons.DiamondOutlined },
  ],
  consumables: [
    { name: 'Potion', icon: Icons.LocalDrinkOutlined },
    { name: 'Scroll', icon: Icons.DescriptionOutlined },
    { name: 'Food', icon: Icons.RestaurantOutlined },
    { name: 'Book', icon: Icons.MenuBookOutlined },
    { name: 'Crystal', icon: Icons.DiamondOutlined },
    { name: 'Elixir', icon: Icons.ScienceOutlined },
  ],
  magic: [
    { name: 'Wand', icon: Icons.AutoFixHighOutlined },
    { name: 'Orb', icon: Icons.BlurOnOutlined },
    { name: 'Rune', icon: Icons.GradeOutlined },
    { name: 'Spell', icon: Icons.AutoAwesomeOutlined },
    { name: 'Enchant', icon: Icons.AutoFixNormalOutlined },
  ],
  tools: [
    { name: 'Pickaxe', icon: Icons.HandymanOutlined },
    { name: 'Fishing Rod', icon: Icons.PhishingOutlined },
    { name: 'Hammer', icon: Icons.GavelOutlined },
    { name: 'Compass', icon: Icons.ExploreOutlined },
  ],
  special: [
    { name: 'Key', icon: Icons.VpnKeyOutlined },
    { name: 'Chest', icon: Icons.Inventory2Outlined },
    { name: 'Map', icon: Icons.MapOutlined },
    { name: 'Crown', icon: Icons.WorkspacePremiumOutlined },
    { name: 'Trophy', icon: Icons.EmojiEventsOutlined },
    { name: 'Gift', icon: Icons.CardGiftcardOutlined },
  ],
};

export const CreateItemDialog: React.FC<CreateItemDialogProps> = ({
  open,
  onClose,
  onItemCreated
}): JSX.Element => {
  const [formData, setFormData] = useState<ItemFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [selectedIconCategory, setSelectedIconCategory] = useState('weapons');
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

  const renderIconGrid = () => {
    const icons = ITEM_ICONS[selectedIconCategory as keyof typeof ITEM_ICONS] || [];
    return (
      <Grid container spacing={1} sx={{ mt: 1 }}>
        {icons.map((iconData) => (
          <Grid item xs={4} sm={3} md={2} key={iconData.name}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: 1,
                cursor: 'pointer',
                borderRadius: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'action.hover',
                  transform: 'scale(1.05)',
                },
                ...(formData.icon === iconData.name && {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                }),
              }}
              onClick={() => handleIconChange(iconData.name)}
            >
              {React.createElement(iconData.icon, {
                sx: { fontSize: 32, mb: 1, color: formData.icon_color },
              })}
              <Typography variant="caption" align="center">
                {iconData.name}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    );
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

          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Icon</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={selectedIconCategory}
                onChange={(_, newValue) => setSelectedIconCategory(newValue)}
                variant="scrollable"
                scrollButtons="auto"
              >
                {Object.keys(ITEM_ICONS).map((category) => (
                  <Tab
                    key={category}
                    label={category.charAt(0).toUpperCase() + category.slice(1)}
                    value={category}
                  />
                ))}
              </Tabs>
            </Box>
            {renderIconGrid()}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
              <Typography>Icon Color:</Typography>
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