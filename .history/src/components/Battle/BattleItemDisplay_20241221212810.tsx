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

type ItemEffect = {
  type: string;
  value?: number;
  metadata?: {
    battle_only?: boolean;
    [key: string]: any;
  };
};

type ItemEffectObject = {
  type?: string;
  boostType?: string;
  metadata?: {
    battle_only?: boolean;
    [key: string]: any;
  };
  battle_only?: boolean;
};

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

  // Helper to check if an effect is battle-related
  const isBattleEffect = (effectType: string): boolean => {
    return [
      'eliminate_wrong_answer',
      'battle_hint',
      'time_bonus',
      'battle_boost',
      'battle'
    ].includes(effectType);
  };

  // Get effect description for display
  const getEffectDescription = (effect: ItemEffect): string => {
    switch (effect.type) {
      case 'eliminate_wrong_answer':
        return `${t('items.effects.eliminate_wrong_answer', { count: effect.value || 1 })}`;
      case 'battle_hint':
        return t('items.effects.battle_hint');
      case 'time_bonus':
        return t('items.effects.time_bonus', { seconds: effect.value || 10 });
      case 'battle_boost':
        return t('items.effects.battle_boost', { percent: effect.value || 10 });
      case 'battle':
        return t('items.effects.battle_generic');
      default:
        return effect.type;
    }
  };

  // Filter for battle-specific items
  const battleItems = items.filter(item => {
    const effects = item.effects;
    const hasBattleEffects = 
      // Handle array of effects
      (Array.isArray(effects) && effects.some(effect => 
        isBattleEffect((effect as ItemEffect).type) ||
        (effect as ItemEffect).metadata?.battle_only
      )) ||
      // Handle object effects
      (!Array.isArray(effects) && effects && typeof effects === 'object' && (
        ('type' in effects && isBattleEffect((effects as ItemEffectObject).type || '')) ||
        ('boostType' in effects && (effects as ItemEffectObject).boostType === 'battle') ||
        ('metadata' in effects && (effects as ItemEffectObject).metadata?.battle_only) ||
        ('battle_only' in effects && (effects as ItemEffectObject).battle_only)
      ));
    
    console.log('[BattleItemDisplay] Filtering item:', {
      id: item.id,
      name: item.name,
      effects: item.effects,
      hasBattleEffects,
      quantity: item.quantity,
      passesFilter: hasBattleEffects && item.quantity > 0
    });

    return hasBattleEffects && item.quantity > 0;
  });

  console.log('[BattleItemDisplay] Filtered battle items:', {
    totalItems: items.length,
    battleItems: battleItems.length,
    items: battleItems.map(item => ({
      id: item.id,
      name: item.name,
      effects: item.effects
    }))
  });

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
                    {getEffectDescription(effect as ItemEffect)}
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