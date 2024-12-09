import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  IconButton,
  TextField,
  Box,
  Typography,
  InputAdornment,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import * as Icons from '@mui/icons-material';
import { SvgIconComponent } from '@mui/icons-material';
import { ChromePicker, ColorResult } from 'react-color';
import FileUploadIcon from '@mui/icons-material/FileUpload';

// Add interface for IconData
interface IconData {
  name: string;
  icon: SvgIconComponent;
  color?: string;
}

// Extended icon categories
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
  effects: [
    { name: 'XP Boost', icon: Icons.TrendingUpOutlined },
    { name: 'Coin Boost', icon: Icons.PaidOutlined },
    { name: 'Power Up', icon: Icons.BoltOutlined },
    { name: 'Time Boost', icon: Icons.TimerOutlined },
    { name: 'Shield', icon: Icons.ShieldOutlined },
    { name: 'Speed', icon: Icons.SpeedOutlined },
  ],
};

interface ItemIconSelectorProps {
  value: string;
  onChange: (iconName: string, color?: string) => void;
  initialColor?: string;
}

export function ItemIconSelector({ value, onChange, initialColor = '#000000' }: ItemIconSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [customIcon, setCustomIcon] = useState<string | null>(null);

  const handleSelectIcon = (iconName: string) => {
    onChange(iconName, selectedColor);
    setOpen(false);
  };

  const handleColorChange = (color: ColorResult) => {
    setSelectedColor(color.hex);
    if (value) {
      onChange(value, color.hex);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const base64 = await convertToBase64(file);
        setCustomIcon(base64);
        onChange(`custom:${base64}`, selectedColor);
      } catch (error) {
        console.error('Error uploading icon:', error);
      }
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const renderIconButton = (iconData: IconData) => (
    <Box
      key={iconData.name}
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
          transform: 'translateY(-2px)',
        },
        ...(value === iconData.name && {
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
        }),
      }}
      onClick={() => handleSelectIcon(iconData.name)}
    >
      {React.createElement(iconData.icon, {
        sx: { fontSize: 32, mb: 1, color: selectedColor },
      })}
      <Typography variant="caption" align="center">
        {iconData.name}
      </Typography>
    </Box>
  );

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={() => setOpen(true)}>
          {customIcon ? (
            <img src={customIcon} alt="Custom icon" style={{ width: 24, height: 24 }} />
          ) : value ? (
            React.createElement(ITEM_ICONS.weapons[0].icon, {
              sx: { color: selectedColor },
            })
          ) : (
            <Icons.AddPhotoAlternateOutlined />
          )}
        </IconButton>
        <IconButton onClick={() => setShowColorPicker(!showColorPicker)}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: selectedColor,
              border: '2px solid',
              borderColor: 'divider',
            }}
          />
        </IconButton>
      </Box>

      {showColorPicker && (
        <Box sx={{ position: 'absolute', zIndex: 2 }}>
          <ChromePicker
            color={selectedColor}
            onChange={handleColorChange}
            onChangeComplete={handleColorChange}
          />
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Select Item Icon</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              component="label"
              variant="outlined"
              startIcon={<FileUploadIcon />}
              sx={{ mr: 1 }}
            >
              Upload Custom Icon
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileUpload}
              />
            </Button>
          </Box>

          {/* ... rest of the dialog content ... */}
        </DialogContent>
      </Dialog>
    </>
  );
} 