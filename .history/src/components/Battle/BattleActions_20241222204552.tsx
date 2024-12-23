import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { Swords, Shield, Gavel } from 'lucide-react';
import Button from '../Button';
import { BattleAction } from '../../types/battle';

const ACTION_LABELS: Record<BattleAction, string> = {
  'inicial': 'Inicial',
  'contestacao': 'Contestação',
  'reconvencao': 'Reconvenção'
};

const ACTION_ICONS: Record<BattleAction, React.ReactNode> = {
  'inicial': <Swords size={20} />,
  'contestacao': <Shield size={20} />,
  'reconvencao': <Gavel size={20} />
};

interface BattleActionsProps {
  selectedAction: BattleAction | null;
  onSelectAction: (action: BattleAction) => void;
  onReady: () => void;
  isReady: boolean;
  disabled?: boolean;
}

export function BattleActions({ 
  selectedAction, 
  onSelectAction, 
  onReady,
  isReady,
  disabled = false 
}: BattleActionsProps) {
  const theme = useTheme();

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2
    }}>
      {/* Action Selection Circle */}
      <Box sx={{ 
        display: 'flex',
        gap: 2,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
      }}>
        {Object.entries(ACTION_LABELS).map(([action, label]) => (
          <Button
            key={action}
            variant={selectedAction === action ? 'contained' : 'outlined'}
            onClick={() => onSelectAction(action as BattleAction)}
            disabled={isReady || disabled}
            startIcon={ACTION_ICONS[action as BattleAction]}
            sx={{
              minWidth: 140,
              bgcolor: selectedAction === action ? 'primary.main' : 'transparent',
              borderColor: selectedAction === action ? 'primary.main' : alpha(theme.palette.primary.main, 0.3),
              '&:hover': {
                bgcolor: selectedAction === action ? 'primary.dark' : alpha(theme.palette.primary.main, 0.1)
              }
            }}
          >
            {label}
          </Button>
        ))}
      </Box>

      {/* Ready Button */}
      <Button
        variant="contained"
        color="success"
        disabled={!selectedAction || isReady || disabled}
        onClick={onReady}
        sx={{ 
          minWidth: 200,
          py: 1.5
        }}
      >
        Ready
      </Button>

      {/* Action Description */}
      {selectedAction && !isReady && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ textAlign: 'center', maxWidth: 400 }}
        >
          {getActionDescription(selectedAction)}
        </Typography>
      )}
    </Box>
  );
}

function getActionDescription(action: BattleAction): string {
  switch (action) {
    case 'inicial':
      return 'A petição inicial é forte contra a reconvenção, mas fraca contra a contestação.';
    case 'contestacao':
      return 'A contestação é forte contra a inicial, mas fraca contra a reconvenção.';
    case 'reconvencao':
      return 'A reconvenção é forte contra a contestação, mas fraca contra a inicial.';
  }
} 