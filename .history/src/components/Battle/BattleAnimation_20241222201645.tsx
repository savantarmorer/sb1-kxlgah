import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface BattleResult {
  attacker: 'player' | 'opponent';
  damage: number;
  shieldBlock?: number;
  shieldBreak?: number;
}

interface BattleAnimationProps {
  result: BattleResult;
}

export default function BattleAnimation({ result }: BattleAnimationProps) {
  return (
    <Box sx={{ 
      position: 'absolute', 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)',
      textAlign: 'center'
    }}>
      <motion.div
        initial={{ x: result.attacker === 'player' ? -300 : 300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" sx={{ 
          color: result.attacker === 'player' ? 'primary.main' : 'error.main',
          textShadow: '0 0 10px currentColor'
        }}>
          {result.damage > 0 ? `${result.damage} Damage!` : 'No damage'}
        </Typography>
        {result.shieldBlock > 0 && (
          <Typography variant="h5" color="info.main">
            Shield blocked {result.shieldBlock}!
          </Typography>
        )}
        {result.shieldBreak > 0 && (
          <Typography variant="h5" color="warning.main">
            Shield broken! (-{result.shieldBreak})
          </Typography>
        )}
      </motion.div>
    </Box>
  );
} 