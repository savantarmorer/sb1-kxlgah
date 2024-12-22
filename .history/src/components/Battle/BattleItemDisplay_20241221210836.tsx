import React, { useEffect } from 'react';
import { Box, IconButton, Tooltip, Typography, Badge } from '@mui/material';
import { motion } from 'framer-motion';
import { InventoryItem, ItemEffectType } from '../../types/items';
import { use_language } from '../../contexts/LanguageContext';
import { ItemIcon } from '../common/ItemIcon';

interface BattleItemDisplayProps {
  items: InventoryItem[];
  onUseItem: (item: InventoryItem) => void;
  disabled?: boolean;
}

export function BattleItemDisplay({ items, onUseItem, disabled }: BattleItemDisplayProps) {
  const { t } = use_language();

  // Add logging for component props
  useEffect(() => {
    console.log('[BattleItemDisplay] Rendering with props:', {
      itemCount: items.length,
      disabled,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        effects: item.effects
      }))
    });
  }, [items, disabled]);

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
        return `${t('items.effects.eliminate_wrong_answer', { count: effect.value })}`;
      case 'battle_hint':
        return t('items.effects.battle_hint');
      case 'time_bonus':
        return t('items.effects.time_bonus', { seconds: effect.value });
      case 'battle_boost':
        return t('items.effects.battle_boost', { percent: effect.value });
      default:
        return effect.type;
    }
  };

  if (battleItems.length === 0) {
    console.log('[BattleItemDisplay] No battle items to display');
    return null;
  }

  const handleItemClick = (item: InventoryItem) => {
    console.log('[BattleItemDisplay] Item clicked:', {
      id: item.id,
      name: item.name,
      disabled
    });
    
    if (disabled) {
      console.log('[BattleItemDisplay] Item use blocked - component disabled');
      return;
    }
    
    onUseItem(item);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {battleItems.map((item) => (
        <motion.div
          key={item.id}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
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
                onClick={() => handleItemClick(item)}
                disabled={disabled || item.quantity <= 0}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)'
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    opacity: 0.5
                  }
                }}
              >
                <Badge
                  badgeContent={item.quantity}
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: disabled ? 'rgba(255, 255, 255, 0.3)' : undefined
                    }
                  }}
                >
                  <ItemIcon item={item} />
                </Badge>
              </IconButton>
            </span>
          </Tooltip>
        </motion.div>
      ))}
    </Box>
  );
} 