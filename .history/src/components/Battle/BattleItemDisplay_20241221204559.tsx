import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { InventoryItem, ItemEffectType } from '../../types/items';
import { use_language } from '../../contexts/LanguageContext';

interface BattleItemDisplayProps {
  items: InventoryItem[];
  onUseItem: (item: InventoryItem) => void;
  disabled?: boolean;
}

export function BattleItemDisplay({ items, onUseItem, disabled }: BattleItemDisplayProps) {
  const { t } = use_language();

  // Filter for battle-specific items
  const battleItems = items.filter(item => 
    Array.isArray(item.effects) &&
    item.effects.some(effect => 
      isBattleEffect(effect.type) ||
      effect.metadata?.battle_only
    ) &&
    item.quantity > 0
  );

  // Helper to check if an effect is battle-related
  const isBattleEffect = (effectType: ItemEffectType): boolean => {
    return [
      'eliminate_wrong_answer',
      'battle_hint',
      'time_bonus',
      'battle_boost'
    ].includes(effectType);
  };

  // Get effect description for display
  const getEffectDescription = (effect: { type: ItemEffectType; value: number }): string => {
    switch (effect.type) {
      case 'eliminate_wrong_answer':
        return `Eliminates ${effect.value} wrong answer${effect.value > 1 ? 's' : ''}`;
      case 'battle_hint':
        return 'Provides a hint';
      case 'time_bonus':
        return `Adds ${effect.value} seconds`;
      case 'battle_boost':
        return `Increases score by ${effect.value}%`;
      default:
        return effect.type;
    }
  };

  if (battleItems.length === 0) {
    return null;
  }

  return (
    <Box sx={{ 
      position: 'absolute',
      right: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      zIndex: 100,
      pointerEvents: 'auto'
    }}>
      {battleItems.map((item) => (
        <motion.div
          key={item.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ 
            position: 'relative',
            zIndex: 101
          }}
        >
          <Tooltip 
            title={
              <Box>
                <Typography variant="subtitle2">{item.name}</Typography>
                <Typography variant="body2">{item.description}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  {t('inventory.quantity')}: {item.quantity}
                </Typography>
                {Array.isArray(item.effects) && item.effects.map((effect, index) => (
                  <Typography key={index} variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                    {getEffectDescription(effect)}
                  </Typography>
                ))}
              </Box>
            }
            placement="left"
          >
            <span>
              <IconButton
                onClick={() => onUseItem(item)}
                disabled={disabled || item.quantity <= 0}
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  position: 'relative',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    opacity: 0.5,
                  }
                }}
              >
                <img 
                  src={item.imageUrl || `/images/items/${item.id}.png`}
                  alt={item.name}
                  style={{ width: 32, height: 32 }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = Array.isArray(item.effects) 
                      ? item.effects.find(effect => effect.metadata?.icon)?.metadata?.icon || '🧪'
                      : '🧪';
                  }}
                />
                {item.quantity > 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      boxShadow: 1
                    }}
                  >
                    {item.quantity}
                  </Box>
                )}
              </IconButton>
            </span>
          </Tooltip>
        </motion.div>
      ))}
    </Box>
  );
} 