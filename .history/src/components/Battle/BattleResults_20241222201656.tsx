import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';

interface BattleResultsProps {
  isVictory: boolean;
  showConfetti: boolean;
}

export default function BattleResults({ isVictory, showConfetti }: BattleResultsProps) {
  const navigate = useNavigate();

  return (
    <>
      <Box sx={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <Typography variant="h3" color={isVictory ? 'success.main' : 'error.main'}>
          {isVictory ? 'Victory!' : 'Defeat'}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/battle')} 
          sx={{ mt: 2 }}
        >
          Return to Battle Menu
        </Button>
      </Box>
      {showConfetti && <Confetti />}
    </>
  );
}
