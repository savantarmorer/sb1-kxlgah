import React, { useState } from 'react';
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
  IconButton,
  Grid,
  Chip,
  Typography,
  SelectChangeEvent,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import { ItemEffect, ItemEffectType, ItemType } from '../../types/items';
import { ItemEffectVisualization } from './ItemEffectVisualization';
import { validateEffectCombination } from '../../utils/itemEffects';

interface ItemEffectsManagerProps {
  effects: ItemEffect[];
  onChange: (effects: ItemEffect[]) => void;
  itemType: ItemType;
}

interface EffectValidation {
  isValid: boolean;
  message?: string;
}

const EFFECT_LIMITS: Record<ItemType, { maxEffects: number; allowedTypes: string[] }> = {
  [ItemType.BOOSTER]: {
    maxEffects: 1,
    allowedTypes: ['xp_boost', 'coin_boost', 'battle_boost', 'quest_boost'],
  },
  [ItemType.CONSUMABLE]: {
    maxEffects: 2,
    allowedTypes: ['instant_xp', 'instant_coins', 'streak_protection', 'eliminate_wrong_answer'],
  },
  [ItemType.EQUIPMENT]: {
    maxEffects: 3,
    allowedTypes: ['battle_boost', 'xp_boost', 'coin_boost'],
  },
  [ItemType.COSMETIC]: {
    maxEffects: 0,
    allowedTypes: [],
  },
  [ItemType.MATERIAL]: {
    maxEffects: 0,
    allowedTypes: [],
  },
  [ItemType.QUEST]: {
    maxEffects: 0,
    allowedTypes: [],
  },
  [ItemType.LOOTBOX]: {
    maxEffects: 0,
    allowedTypes: [],
  }
};

const initialEffect: ItemEffect = {
  type: 'xp_boost',
  value: 0,
  duration: 3600, // 1 hour
  metadata: {
    boost_percentage: 0,
  },
};

export function ItemEffectsManager({ effects, onChange, itemType }: ItemEffectsManagerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [currentEffect, setCurrentEffect] = useState<ItemEffect>(initialEffect);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateEffect = (effect: ItemEffect): EffectValidation => {
    // Basic validation
    if (effect.value < 0) {
      return { isValid: false, message: 'Value cannot be negative' };
    }

    if (effect.type.includes('boost') && (!effect.metadata?.boost_percentage || effect.metadata.boost_percentage > 100)) {
      return { isValid: false, message: 'Boost percentage must be between 1 and 100' };
    }

    // Item type specific validation
    if (itemType && EFFECT_LIMITS[itemType]) {
      const limits = EFFECT_LIMITS[itemType];
      
      if (!limits.allowedTypes.includes(effect.type)) {
        return { 
          isValid: false, 
          message: `This type of effect is not allowed for ${itemType} items` 
        };
      }

      if (effects.length >= limits.maxEffects) {
        return { 
          isValid: false, 
          message: `${itemType} items can only have ${limits.maxEffects} effects` 
        };
      }
    }

    // Effect stacking validation
    const existingEffectOfType = effects.find(e => e.type === effect.type);
    if (existingEffectOfType) {
      return { 
        isValid: false, 
        message: 'Cannot stack effects of the same type' 
      };
    }

    return { isValid: true };
  };

  const handleAddEffect = () => {
    const validation = validateEffect(currentEffect);
    if (!validation.isValid) {
      setValidationError(validation.message || 'Invalid effect');
      return;
    }

    // Check effect combinations
    if (!validateEffectCombination(effects, currentEffect)) {
      setValidationError('This effect cannot be combined with existing effects');
      return;
    }

    onChange([...effects, currentEffect]);
    setCurrentEffect(initialEffect);
    setValidationError(null);
    setShowDialog(false);
  };

  const handleRemoveEffect = (index: number) => {
    const newEffects = effects.filter((_, i) => i !== index);
    onChange(newEffects);
  };

  const handleEffectChange = (
    field: keyof ItemEffect | 'boost_percentage',
    value: string | number
  ) => {
    if (field === 'boost_percentage') {
      setCurrentEffect(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          boost_percentage: Number(value),
        },
      }));
    } else {
      setCurrentEffect(prev => ({
        ...prev,
        [field]: field === 'type' ? value : Number(value),
      }));
    }
  };

  const getEffectDescription = (effect: ItemEffect): string => {
    switch (effect.type) {
      case 'xp_boost':
        return `+${effect.metadata?.boost_percentage}% XP for ${effect.duration! / 3600}h`;
      case 'coin_boost':
        return `+${effect.metadata?.boost_percentage}% Coins for ${effect.duration! / 3600}h`;
      case 'battle_boost':
        return `+${effect.value} Battle Power for ${effect.duration! / 3600}h`;
      case 'streak_protection':
        return `Protects streak ${effect.metadata?.max_uses} times`;
      case 'instant_xp':
        return `+${effect.value} XP instantly`;
      case 'instant_coins':
        return `+${effect.value} Coins instantly`;
      case 'quest_boost':
        return `+${effect.metadata?.boost_percentage}% Quest Progress`;
      case 'unlock_content':
        return `Unlocks special content`;
      case 'eliminate_wrong_answer':
        return `Eliminates ${effect.value} wrong answer${effect.value > 1 ? 's' : ''}`;
      default:
        return 'Unknown effect';
    }
  };

  const getEffectPreview = (effect: ItemEffect): string => {
    const base = getEffectDescription(effect);
    let details = '';

    switch (effect.type) {
      case 'xp_boost':
      case 'coin_boost':
      case 'quest_boost':
        const hourlyGain = effect.metadata?.boost_percentage || 0;
        const totalGain = (hourlyGain * (effect.duration || 0) / 3600).toFixed(0);
        details = `Total potential gain: ${totalGain}%`;
        break;
      case 'battle_boost':
        details = `Effective power increase: ${effect.value * 100}%`;
        break;
      case 'streak_protection':
        details = `Saves your streak ${effect.metadata?.max_uses} times`;
        break;
    }

    return details ? `${base}\n${details}` : base;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1">
          Effects
          <Tooltip title="Effects modify item behavior and provide bonuses">
            <InfoIcon sx={{ ml: 1, fontSize: 16, color: 'action.active' }} />
          </Tooltip>
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={() => setShowDialog(true)}
          size="small"
          disabled={itemType && effects.length >= (EFFECT_LIMITS[itemType]?.maxEffects || Infinity)}
        >
          Add Effect
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {effects.map((effect, index) => (
          <Tooltip key={index} title={getEffectPreview(effect)} arrow>
            <Chip
              label={getEffectDescription(effect)}
              onDelete={() => handleRemoveEffect(index)}
              color={effect.duration ? 'primary' : 'secondary'}
              variant="outlined"
            />
          </Tooltip>
        ))}
      </Box>

      <Box sx={{ mt: 2 }}>
        {effects.map((effect, index) => (
          <ItemEffectVisualization
            key={index}
            effect={effect}
            itemType={itemType}
          />
        ))}
      </Box>

      <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Effect</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Effect Type</InputLabel>
                <Select
                  value={currentEffect.type}
                  onChange={(e: SelectChangeEvent) => handleEffectChange('type', e.target.value)}
                  label="Effect Type"
                >
                  <MenuItem value="xp_boost">XP Boost</MenuItem>
                  <MenuItem value="coin_boost">Coin Boost</MenuItem>
                  <MenuItem value="battle_boost">Battle Boost</MenuItem>
                  <MenuItem value="streak_protection">Streak Protection</MenuItem>
                  <MenuItem value="instant_xp">Instant XP</MenuItem>
                  <MenuItem value="instant_coins">Instant Coins</MenuItem>
                  <MenuItem value="quest_boost">Quest Boost</MenuItem>
                  <MenuItem value="unlock_content">Unlock Content</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {currentEffect.type.includes('boost') && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Boost Percentage"
                  value={currentEffect.metadata?.boost_percentage || 0}
                  onChange={(e) => handleEffectChange('boost_percentage', e.target.value)}
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                />
              </Grid>
            )}

            {['instant_xp', 'instant_coins', 'battle_boost'].includes(currentEffect.type) && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Value"
                  value={currentEffect.value}
                  onChange={(e) => handleEffectChange('value', e.target.value)}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
            )}

            {!currentEffect.type.includes('instant') && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (hours)"
                  value={currentEffect.duration ? currentEffect.duration / 3600 : 0}
                  onChange={(e) => handleEffectChange('duration', Number(e.target.value) * 3600)}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
            )}
          </Grid>
          {validationError && (
            <Typography color="error" variant="caption" sx={{ mt: 1 }}>
              {validationError}
            </Typography>
          )}
          {itemType && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {`${effects.length}/${EFFECT_LIMITS[itemType]?.maxEffects || '∞'} effects used`}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddEffect}
            variant="contained"
            color="primary"
            disabled={!!validationError}
          >
            Add Effect
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 