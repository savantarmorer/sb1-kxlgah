import React from 'react';
import { 
  Drawer,
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button
} from '@mui/material';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  rarityFilter: string[];
  onRarityChange: (rarities: string[]) => void;
}

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export function FilterDrawer({ 
  open, 
  onClose, 
  rarityFilter, 
  onRarityChange 
}: FilterDrawerProps) {
  const handleRarityToggle = (rarity: string) => {
    const newFilter = rarityFilter.includes(rarity)
      ? rarityFilter.filter(r => r !== rarity)
      : [...rarityFilter, rarity];
    onRarityChange(newFilter);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
    >
      <Box sx={{ width: 250, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          Rarity
        </Typography>
        <FormGroup>
          {RARITIES.map(rarity => (
            <FormControlLabel
              key={rarity}
              control={
                <Checkbox
                  checked={rarityFilter.includes(rarity)}
                  onChange={() => handleRarityToggle(rarity)}
                />
              }
              label={rarity.charAt(0).toUpperCase() + rarity.slice(1)}
            />
          ))}
        </FormGroup>

        <Box sx={{ mt: 3 }}>
          <Button 
            fullWidth 
            variant="outlined" 
            onClick={() => onRarityChange([])}
          >
            Clear Filters
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
} 