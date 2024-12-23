import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import { Sword, Shield, Scale } from 'lucide-react';
import { BattleAction } from '../../types/battle';
import Button from '../Button';

interface BattleActionsProps {
  selectedAction: BattleAction | null;
  onSelectAction: (action: BattleAction) => void;
  isReady: boolean;
  onReady: () => void;
  disabled?: boolean;
}

const ACTION_ICONS = {
  'inicial': Shield,
  'contestacao': Scale,
  'reconvencao': Sword
};

const ACTION_LABELS = {
  'inicial': 'Inicial',
  'contestacao': 'Contestação',
  'reconvencao': 'Reconvenção'
};

export function BattleActions({ 
  selectedAction, 
  onSelectAction, 
  isReady,
  onReady,
  disabled = false 
}: BattleActionsProps) {
  const theme = useTheme();

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      p: 2,
      position: 'relative'
    }}>
      {/* Action Selection Circle */}
      <Box sx={{ 
        position: 'relative',
        width: 200,
        height: 200,
        mb: 2
      }}>
        {Object.entries(ACTION_ICONS).map(([action, Icon], index) => {
          // Adjust angles to position icons correctly
          const angle = ((index * 120) - 90) * (Math.PI / 180); // Start from top (-90 degrees)
          const radius = 80; // Distance from center
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const isSelected = selectedAction === action;

          return (
            <motion.div
              key={action}
              initial={false}
              animate={{
                scale: isSelected ? 1.1 : 1,
                x: 100 + x,
                y: 100 + y
              }}
              style={{
                position: 'absolute',
                transform: 'translate(-50%, -50%)',
                cursor: disabled || isReady ? 'default' : 'pointer'
              }}
            >
              <Button
                variant={isSelected ? 'primary' : 'ghost'}
                onClick={() => !disabled && !isReady && onSelectAction(action as BattleAction)}
                disabled={disabled || isReady}
                sx={{ 
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  p: 0,
                  minWidth: 'unset',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1)
                  }
                }}
              >
                <Icon size={30} />
              </Button>
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  mt: 1,
                  whiteSpace: 'nowrap',
                  color: isSelected ? 'primary.main' : 'text.secondary',
                  fontWeight: isSelected ? 'bold' : 'normal'
                }}
              >
                {ACTION_LABELS[action as BattleAction]}
              </Typography>
            </motion.div>
          );
        })}

        {/* Center Label */}
        {selectedAction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: 'primary.main',
                fontWeight: 'bold',
                textAlign: 'center'
              }}
            >
              {ACTION_LABELS[selectedAction]}
            </Typography>
          </motion.div>
        )}
      </Box>

      {/* Ready Button */}
      <Button
        variant={isReady ? 'success' : 'primary'}
        onClick={onReady}
        disabled={disabled || !selectedAction || isReady}
        sx={{ 
          minWidth: 120,
          mt: 2
        }}
      >
        {isReady ? 'Pronto!' : 'Confirmar'}
      </Button>
    </Box>
  );
} 