import { Box, Typography, Grid, Paper } from '@mui/material';
import { BattleQuestion } from '../../types/battle';

interface AnswerRevealProps {
  playerAnswer: string | null;
  opponentAnswer: string | null;
  question: BattleQuestion;
  playerIsCorrect: boolean;
  opponentIsCorrect: boolean;
}

export default function AnswerReveal({ 
  playerAnswer, 
  opponentAnswer, 
  question, 
  playerIsCorrect, 
  opponentIsCorrect 
}: AnswerRevealProps) {
  return (
    <Box sx={{ 
      position: 'absolute', 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)',
      width: '80%',
      bgcolor: 'background.paper',
      borderRadius: 2,
      p: 4,
      textAlign: 'center'
    }}>
      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={6}>
          <Typography variant="h6" color="primary.main">Your Answer</Typography>
          <Paper sx={{ 
            p: 2, 
            bgcolor: playerIsCorrect ? 'success.dark' : 'error.dark',
            color: 'white'
          }}>
            {playerAnswer || '-'}
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="h6" color="error.main">Opponent's Answer</Typography>
          <Paper sx={{ 
            p: 2, 
            bgcolor: opponentIsCorrect ? 'success.dark' : 'error.dark',
            color: 'white'
          }}>
            {opponentAnswer || '-'}
          </Paper>
        </Grid>
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="h6" color="success.main">Correct Answer</Typography>
          <Paper sx={{ p: 2, bgcolor: 'success.dark', color: 'white' }}>
            {question.correct_answer}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 