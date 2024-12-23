import React from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { BattleQuestion } from '../../types/battle';
import Button from '../Button';

interface QuestionDisplayProps {
  question: BattleQuestion;
  on_answer: (answer: string) => void;
  selected_answer: string | null;
  is_correct: boolean | null;
  time_left: number;
}

export function QuestionDisplay({
  question,
  on_answer,
  selected_answer,
  is_correct,
  time_left
}: QuestionDisplayProps) {
  const theme = useTheme();

  const answers = [
    { key: 'A', text: question.alternative_a },
    { key: 'B', text: question.alternative_b },
    { key: 'C', text: question.alternative_c },
    { key: 'D', text: question.alternative_d }
  ];

  const getButtonVariant = (key: string) => {
    if (!selected_answer) return 'ghost';
    if (selected_answer === key) {
      return is_correct ? 'success' : 'error';
    }
    if (is_correct !== null && key === question.correct_answer) {
      return 'success';
    }
    return 'ghost';
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Question */}
      <Typography variant="h6" sx={{ mb: 4, fontWeight: 'medium' }}>
        {question.question}
      </Typography>

      {/* Answers */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 2
      }}>
        {answers.map(({ key, text }) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant={getButtonVariant(key)}
              onClick={() => !selected_answer && on_answer(key)}
              disabled={!!selected_answer}
              fullWidth
              sx={{ 
                p: 2,
                height: 'auto',
                textAlign: 'left',
                whiteSpace: 'normal',
                lineHeight: 1.4,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 'bold',
                    minWidth: 24
                  }}
                >
                  {key}.
                </Typography>
                <Typography variant="body1">
                  {text}
                </Typography>
              </Box>
            </Button>
          </motion.div>
        ))}
      </Box>
    </Box>
  );
}
