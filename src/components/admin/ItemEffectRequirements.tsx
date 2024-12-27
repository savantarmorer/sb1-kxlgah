import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Grid,
  Typography,
  Chip,
  SelectChangeEvent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { ItemRequirement } from '../../types/items';

interface ItemEffectRequirementsProps {
  requirements: ItemRequirement[];
  onChange: (requirements: ItemRequirement[]) => void;
}

const REQUIREMENT_TYPES: Record<string, { label: string; type: 'number' | 'select'; min?: number; max?: number }> = {
  level: { label: 'Level', type: 'number', min: 1, max: 100 },
  achievement: { label: 'Achievement', type: 'select' },
  quest: { label: 'Quest', type: 'select' },
  item: { label: 'Item', type: 'select' },
};

export function ItemEffectRequirements({ requirements, onChange }: ItemEffectRequirementsProps) {
  const handleAddRequirement = (type: string) => {
    const newRequirement: ItemRequirement = {
      type: type as 'level' | 'achievement' | 'quest' | 'item',
      value: type === 'level' ? 1 : '',
      comparison: 'gte'
    };
    onChange([...requirements, newRequirement]);
  };

  const handleRemoveRequirement = (index: number) => {
    const newRequirements = requirements.filter((_, i) => i !== index);
    onChange(newRequirements);
  };

  const handleRequirementChange = (index: number, field: keyof ItemRequirement, value: any) => {
    const newRequirements = [...requirements];
    newRequirements[index] = { ...newRequirements[index], [field]: value };
    onChange(newRequirements);
  };

  const getRequirementLabel = (requirement: ItemRequirement): string => {
    const type = REQUIREMENT_TYPES[requirement.type].label;
    const comparison = requirement.comparison === 'gte' ? '>=' : '=';
    return `${type} ${comparison} ${requirement.value}`;
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Requirements
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {requirements.map((req, index) => (
          <Chip
            key={index}
            label={getRequirementLabel(req)}
            onDelete={() => handleRemoveRequirement(index)}
            color="primary"
            variant="outlined"
          />
        ))}
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth size="small">
            <InputLabel>Add Requirement</InputLabel>
            <Select
              label="Add Requirement"
              value=""
              onChange={(e: SelectChangeEvent) => handleAddRequirement(e.target.value)}
            >
              {Object.entries(REQUIREMENT_TYPES).map(([key, value]) => (
                <MenuItem key={key} value={key}>
                  {value.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {requirements.map((requirement, index) => (
          <Grid key={index} container item spacing={2} alignItems="center">
            <Grid item xs={4}>
              <Typography variant="body2">
                {REQUIREMENT_TYPES[requirement.type].label}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              {REQUIREMENT_TYPES[requirement.type].type === 'select' ? (
                <FormControl fullWidth size="small">
                  <Select
                    value={requirement.value}
                    onChange={(e) => handleRequirementChange(index, 'value', e.target.value)}
                  >
                    {/* Add dynamic options based on type */}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  type="number"
                  size="small"
                  value={requirement.value}
                  onChange={(e) => handleRequirementChange(index, 'value', Number(e.target.value))}
                  InputProps={{
                    inputProps: {
                      min: REQUIREMENT_TYPES[requirement.type].min,
                      max: REQUIREMENT_TYPES[requirement.type].max
                    }
                  }}
                />
              )}
            </Grid>
            <Grid item xs={3}>
              <FormControl fullWidth size="small">
                <Select
                  value={requirement.comparison}
                  onChange={(e) => handleRequirementChange(index, 'comparison', e.target.value)}
                >
                  <MenuItem value="eq">=</MenuItem>
                  <MenuItem value="gte">≥</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={1}>
              <IconButton
                size="small"
                onClick={() => handleRemoveRequirement(index)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
} 