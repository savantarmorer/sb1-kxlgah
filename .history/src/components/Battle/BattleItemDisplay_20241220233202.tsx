import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { InventoryItem } from '../../types/items';
import { use_language } from '../../contexts/LanguageContext';

interface BattleItemDisplayProps {
  items: InventoryItem[];
  onUseItem: (item: InventoryItem) => void;
  disabled?: boolean;
}

export function BattleItemDisplay({ items, onUseItem, disabled }: BattleItemDisplayProps) {
  const { t } = use_language();
  const battleItems = items.filter(item => 
    item.effects?.some(effect => effect.metadata?.battle_only)
  );

  if (battleItems.length === 0) return null;

  return (
    <Box sx={{ 
      position: 'absolute',
      right: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      zIndex: 10
    }}>
      {battleItems.map((item) => (
        <motion.div
          key={item.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Tooltip 
            title={
              <Box>
                <Typography variant="subtitle2">{item.name}</Typography>
                <Typography variant="body2">{item.description}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  {t('inventory.quantity')}: {item.quantity}
                </Typography>
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
                />
              </IconButton>
            </span>
          </Tooltip>
        </motion.div>
      ))}
    </Box>
  );
} 