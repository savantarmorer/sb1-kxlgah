import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, alpha, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { BattleQuestion } from '../../types/battle';

interface QuestionDisplayProps {
  question: BattleQuestion;
  onAnswer: (answer: string) => void;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  timeLeft: number;
}

export function QuestionDisplay({
  question,
  onAnswer,
  selectedAnswer,
  isCorrect,
  timeLeft
}: QuestionDisplayProps) {
  const theme = useTheme();
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [eliminatedAnswers, setEliminatedAnswers] = useState<string[]>([]);

  // Shuffle answers on question change
  useEffect(() => {
    const allAnswers = [question.correct_answer, ...question.wrong_answers];
    setShuffledAnswers(allAnswers.sort(() => Math.random() - 0.5));
    setEliminatedAnswers([]);
  }, [question]);

  const getAnswerColor = (answer: string) => {
    if (!selectedAnswer) return 'primary';
    if (answer === question.correct_answer) return 'success';
    if (answer === selectedAnswer && !isCorrect) return 'error';
    return 'primary';
  };

  const getAnswerStyle = (answer: string) => {
    const isEliminated = eliminatedAnswers.includes(answer);
    const baseStyle = {
      width: '100%',
      py: 2,
      px: 3,
      mb: 2,
      borderRadius: 2,
      textAlign: 'left',
      transition: 'all 0.2s ease',
      opacity: isEliminated ? 0.5 : 1,
      pointerEvents: isEliminated ? 'none' : 'auto'
    };

    if (!selectedAnswer) {
      return {
        ...baseStyle,
        bgcolor: 'background.paper',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.1)
        }
      };
    }

    if (answer === question.correct_answer) {
      return {
        ...baseStyle,
        bgcolor: alpha(theme.palette.success.main, 0.1),
        borderColor: theme.palette.success.main
      };
    }

    if (answer === selectedAnswer && !isCorrect) {
      return {
        ...baseStyle,
        bgcolor: alpha(theme.palette.error.main, 0.1),
        borderColor: theme.palette.error.main
      };
    }

    return {
      ...baseStyle,
      bgcolor: 'background.paper'
    };
  };

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        {/* Question */}
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          {question.question}
        </Typography>

        {/* Progress Bar */}
        <Box
          sx={{
            width: '100%',
            height: 4,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            borderRadius: 2,
            mb: 4,
            overflow: 'hidden'
          }}
        >
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / 30) * 100}%` }}
            transition={{ duration: 0.5 }}
            style={{
              height: '100%',
              backgroundColor: theme.palette.primary.main,
              borderRadius: 8
            }}
          />
        </Box>

        {/* Answers */}
        <Box sx={{ mt: 4 }}>
          <AnimatePresence mode="wait">
            {shuffledAnswers.map((answer, index) => (
              <motion.div
                key={answer}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant="outlined"
                  color={getAnswerColor(answer)}
                  onClick={() => !selectedAnswer && onAnswer(answer)}
                  disabled={!!selectedAnswer || eliminatedAnswers.includes(answer)}
                  sx={getAnswerStyle(answer)}
                >
                  {answer}
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>

        {/* Feedback */}
        <AnimatePresence>
          {selectedAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography
                  variant="h6"
                  color={isCorrect ? 'success.main' : 'error.main'}
                  sx={{ fontWeight: 600 }}
                >
                  {isCorrect ? 'Correct!' : 'Incorrect!'}
                </Typography>
                {!isCorrect && (
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    The correct answer was: {question.correct_answer}
                  </Typography>
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Box>
  );
}
