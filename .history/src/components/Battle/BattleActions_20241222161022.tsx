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
      p: 2
    }}>
      {/* Action Selection Circle */}
      <Box sx={{ 
        position: 'relative',
        width: 200,
        height: 200,
        mb: 2
      }}>
        {Object.entries(ACTION_ICONS).map(([action, Icon], index) => {
          const angle = (index * 360 / 3) * (Math.PI / 180);
          const x = Math.cos(angle) * 80;
          const y = Math.sin(angle) * 80;
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
                transform: 'translate(-50%, -50%)'
              }}
            >
              <Button
                variant={isSelected ? 'primary' : 'ghost'}
                onClick={() => !disabled && !isReady && onSelectAction(action as BattleAction)}
                disabled={disabled || isReady}
                sx={{ 
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  p: 0,
                  minWidth: 'unset'
                }}
              >
                <Icon size={24} />
              </Button>
            </motion.div>
          );
        })}
        {selectedAction && (
          <Typography
            variant="h6"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'primary.main',
              fontWeight: 'bold'
            }}
          >
            {ACTION_LABELS[selectedAction]}
          </Typography>
        )}
      </Box>

      {/* Ready Button */}
      <Button
        variant={isReady ? 'success' : 'primary'}
        onClick={onReady}
        disabled={disabled || !selectedAction || isReady}
        sx={{ minWidth: 120 }}
      >
        {isReady ? 'Pronto!' : 'Confirmar'}
      </Button>
    </Box>
  );
} 