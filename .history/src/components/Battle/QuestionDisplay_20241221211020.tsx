import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { use_language } from '../../contexts/LanguageContext';
import type { BattleQuestion } from '../../types/battle';

interface QuestionDisplayProps {
  question?: BattleQuestion;
  on_answer: (answer: string) => void;
  disabled?: boolean;
}

export function QuestionDisplay({ question, on_answer, disabled }: QuestionDisplayProps) {
  const { t } = use_language();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  useEffect(() => {
    setSelectedAnswer(null);
  }, [question?.id]);

  if (!question) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography>{t('battle.no_question')}</Typography>
      </Box>
    );
  }

  const options = [
    { key: 'a', text: question.alternative_a },
    { key: 'b', text: question.alternative_b },
    { key: 'c', text: question.alternative_c },
    { key: 'd', text: question.alternative_d }
  ];

  const handleAnswerClick = (answer: string) => {
    if (disabled || selectedAnswer) return;
    setSelectedAnswer(answer);
    on_answer(answer);
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        {question.question}
      </Typography>

      <Grid container spacing={2}>
        {options.map((option) => (
          <Grid item xs={12} key={option.key}>
            <motion.div
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
            >
              <Button
                fullWidth
                variant={selectedAnswer === option.key ? 'contained' : 'outlined'}
                onClick={() => handleAnswerClick(option.key)}
                disabled={disabled || selectedAnswer !== null}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  p: 2,
                  bgcolor: selectedAnswer === option.key ? 'primary.main' : 'transparent',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    bgcolor: selectedAnswer === option.key ? 'primary.dark' : 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.3)'
                  }
                }}
              >
                <Typography>
                  {option.text}
                </Typography>
              </Button>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
