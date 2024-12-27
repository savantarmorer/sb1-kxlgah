import { Box, Button } from '@mui/material';
import { Card } from './BattleMode';

interface BattleActionsProps {
  selectedAction: string | null;
  onSelectAction: (card: Card) => void;
  isReady: boolean;
  onReady: () => void;
  disabled: boolean;
}

export function BattleActions({ selectedAction, onSelectAction, isReady, onReady, disabled }: BattleActionsProps) {
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      gap: 2,
      mt: 2
    }}>
      <Button
        variant="contained"
        color="primary"
        onClick={onReady}
        disabled={disabled || isReady}
        sx={{ minWidth: 120 }}
      >
        {isReady ? 'Ready!' : 'Ready'}
      </Button>
    </Box>
  );
} 