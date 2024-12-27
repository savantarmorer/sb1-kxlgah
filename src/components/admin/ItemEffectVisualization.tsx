import React from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Tooltip,
  Grid,
  useTheme,
  Divider,
  IconButton,
  Collapse,
} from '@mui/material';
import { ItemEffect, ItemType } from '../../types/items';
import { calculateEffectValue, validateEffectCombination } from '../../utils/itemEffects';
import TimelineIcon from '@mui/icons-material/Timeline';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import StackedLineChartIcon from '@mui/icons-material/StackedLineChart';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface ItemEffectVisualizationProps {
  effect: ItemEffect;
  itemType: ItemType;
  otherEffects?: ItemEffect[]; // For stacking preview
  compareWith?: ItemEffect; // For comparison
}

export function ItemEffectVisualization({ 
  effect, 
  itemType, 
  otherEffects = [],
  compareWith 
}: ItemEffectVisualizationProps) {
  const theme = useTheme();
  const [showDetails, setShowDetails] = React.useState(false);

  const getEffectColor = (effectType: string) => {
    switch (effectType) {
      case 'xp_boost':
        return theme.palette.success.main;
      case 'coin_boost':
        return theme.palette.warning.main;
      case 'battle_boost':
        return theme.palette.error.main;
      case 'quest_boost':
        return theme.palette.info.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const getEffectStrength = (effectToCheck: ItemEffect) => {
    const value = calculateEffectValue(effectToCheck, itemType);
    const maxValue = 100; // This could be dynamic based on effect type
    return (value / maxValue) * 100;
  };

  const getStackedValue = () => {
    const compatibleEffects = otherEffects.filter(e => 
      validateEffectCombination([effect], e)
    );
    return compatibleEffects.reduce((total, e) => 
      total + calculateEffectValue(e, itemType), 
      calculateEffectValue(effect, itemType)
    );
  };

  const getDurationDisplay = (duration?: number) => {
    if (!duration) return 'Permanent';
    const hours = duration / 3600;
    return hours >= 24 
      ? `${(hours / 24).toFixed(1)} days`
      : `${hours.toFixed(1)} hours`;
  };

  const renderEffectBar = (effectToRender: ItemEffect, label: string) => (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" color="text.primary">
          {calculateEffectValue(effectToRender, itemType)}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={getEffectStrength(effectToRender)}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.palette.grey[200],
          '& .MuiLinearProgress-bar': {
            backgroundColor: getEffectColor(effectToRender.type),
          },
        }}
      />
    </Box>
  );

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TimelineIcon sx={{ color: getEffectColor(effect.type), mr: 1 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {effect.type.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
          </Typography>
        </Box>
        <Box>
          {otherEffects.length > 0 && (
            <Tooltip title="View stacking effects">
              <IconButton size="small" sx={{ mr: 1 }}>
                <StackedLineChartIcon />
              </IconButton>
            </Tooltip>
          )}
          {compareWith && (
            <Tooltip title="Compare effects">
              <IconButton size="small" sx={{ mr: 1 }}>
                <CompareArrowsIcon />
              </IconButton>
            </Tooltip>
          )}
          <IconButton
            size="small"
            onClick={() => setShowDetails(!showDetails)}
            sx={{
              transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: theme.transitions.create('transform'),
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
      </Box>

      <Collapse in={showDetails}>
        <Box sx={{ mt: 2 }}>
          {renderEffectBar(effect, 'Base Effect')}

          {compareWith && (
            <>
              <Divider sx={{ my: 1 }} />
              {renderEffectBar(compareWith, 'Compared Effect')}
            </>
          )}

          {otherEffects.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Stacked Effect
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    {getStackedValue()}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(getStackedValue() / 100) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      background: `linear-gradient(90deg, ${
                        getEffectColor(effect.type)
                      } 0%, ${theme.palette.primary.main} 100%)`,
                    },
                  }}
                />
              </Box>
            </>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {effect.metadata?.boost_percentage && (
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SpeedIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {effect.metadata.boost_percentage}% Boost
                  </Typography>
                </Box>
              </Grid>
            )}

            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimerIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">
                  {getDurationDisplay(effect.duration)}
                </Typography>
              </Box>
            </Grid>

            {effect.metadata?.max_uses && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <InfoIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    Maximum uses: {effect.metadata.max_uses}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
} 