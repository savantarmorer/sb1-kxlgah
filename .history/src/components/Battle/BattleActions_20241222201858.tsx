import { Box, Button, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { BattleAction } from '../../types/battle';

interface BattleActionsProps {
  selectedAction: BattleAction | null;
  onSelectAction: (action: BattleAction) => void;
  isReady: boolean;
  onReady: () => void;
  disabled?: boolean;
}

export default function BattleActions({
  selectedAction,
  onSelectAction,
  isReady,
  onReady,
  disabled = false
}: BattleActionsProps) {
  const actions: BattleAction[] = ['inicial', 'contestacao', 'reconvencao'];
  const radius = 120;

  return (
    <Box sx={{ 
      position: 'relative',
      width: radius * 2,
      height: radius * 2,
      margin: '0 auto'
    }}>
      {actions.map((action, index) => {
        const angle = (index * 360) / actions.length;
        const x = radius * Math.cos((angle - 90) * (Math.PI / 180));
        const y = radius * Math.sin((angle - 90) * (Math.PI / 180));

        return (
          <motion.div
            key={action}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              x,
              y,
              transform: 'translate(-50%, -50%)'
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <IconButton
              onClick={() => onSelectAction(action)}
              disabled={disabled || isReady}
              sx={{
                width: 80,
                height: 80,
                bgcolor: selectedAction === action ? 'primary.main' : 'background.paper',
                color: selectedAction === action ? 'white' : 'text.primary',
                '&:hover': {
                  bgcolor: selectedAction === action ? 'primary.dark' : 'background.paper'
                }
              }}
            >
              {action.charAt(0).toUpperCase() + action.slice(1)}
            </IconButton>
          </motion.div>
        );
      })}

      <Button
        variant="contained"
        color="primary"
        disabled={!selectedAction || disabled}
        onClick={onReady}
        sx={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 100,
          height: 100,
          borderRadius: '50%'
        }}
      >
        {isReady ? 'Ready!' : 'Ready?'}
      </Button>
    </Box>
  );
} 