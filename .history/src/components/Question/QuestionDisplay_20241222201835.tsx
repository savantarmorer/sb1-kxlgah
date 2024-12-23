import { Box, Typography, Button, Grid } from '@mui/material';
import { BattleQuestion } from '../../types/battle';

interface QuestionDisplayProps {
  question: BattleQuestion;
  onAnswer: (answer: string) => void;
  selectedAnswer: string | null;
  disabled?: boolean;
}

export default function QuestionDisplay({ 
  question, 
  onAnswer, 
  selectedAnswer, 
  disabled = false 
}: QuestionDisplayProps) {
  const answers = ['A', 'B', 'C', 'D'];

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        {question.text}
      </Typography>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {answers.map((answer) => (
          <Grid item xs={12} sm={6} key={answer}>
            <Button
              fullWidth
              variant={selectedAnswer === answer ? 'contained' : 'outlined'}
              color={selectedAnswer === answer ? 'primary' : 'inherit'}
              onClick={() => onAnswer(answer)}
              disabled={disabled}
              sx={{ 
                justifyContent: 'flex-start', 
                textAlign: 'left',
                p: 2,
                height: '100%'
              }}
            >
              <Typography variant="body1">
                {answer}. {question[`answer_${answer.toLowerCase()}`]}
              </Typography>
            </Button>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
} 