import React from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import Button from '../Button';
import { BattleQuestion } from '../../types/battle';

interface QuestionDisplayProps {
  question: BattleQuestion;
  on_answer: (answer: string) => void;
  selected_answer: string | null;
  is_correct: boolean | null;
  time_left: number;
  removed_alternatives?: string[];
}

export function QuestionDisplay({ 
  question, 
  on_answer, 
  selected_answer, 
  is_correct,
  time_left,
  removed_alternatives = []
}: QuestionDisplayProps) {
  const theme = useTheme();

  const getAnswerButtonStyle = (answer: string) => {
    if (!selected_answer) {
      return {
        bgcolor: 'background.paper',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.1)
        }
      };
    }

    if (selected_answer === answer) {
      if (is_correct === null) {
        return {
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          borderColor: theme.palette.primary.main
        };
      }
      return {
        bgcolor: is_correct 
          ? alpha(theme.palette.success.main, 0.1)
          : alpha(theme.palette.error.main, 0.1),
        borderColor: is_correct 
          ? theme.palette.success.main 
          : theme.palette.error.main,
        '&:hover': {
          bgcolor: is_correct 
            ? alpha(theme.palette.success.main, 0.2)
            : alpha(theme.palette.error.main, 0.2)
        }
      };
    }

    if (answer === question.correct_answer && selected_answer) {
      return {
        bgcolor: alpha(theme.palette.success.main, 0.1),
        borderColor: theme.palette.success.main,
        '&:hover': {
          bgcolor: alpha(theme.palette.success.main, 0.2)
        }
      };
    }

    return {
      bgcolor: 'background.paper',
      opacity: 0.5
    };
  };

  const getAnswerIcon = (answer: string) => {
    if (selected_answer !== answer) return null;
    if (is_correct === null) return null;

    return is_correct ? (
      <Check className="text-success" size={20} />
    ) : (
      <X className="text-error" size={20} />
    );
  };

  const getAnswerText = (answer: string): string => {
    switch (answer) {
      case 'a': return question.alternative_a;
      case 'b': return question.alternative_b;
      case 'c': return question.alternative_c;
      case 'd': return question.alternative_d;
      default: return '';
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Timer */}
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'center',
        mb: 4
      }}>
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1,
          px: 3,
          borderRadius: 'full',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.2)
        }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {time_left}s
          </Typography>
        </Box>
      </Box>

      {/* Question */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          {question.question}
        </Typography>
      </Box>

      {/* Alternatives */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2
      }}>
        {alternatives.map(({ key, value }) => {
          const isSelected = selected_answer === value;
          const isCorrect = value === question.correct_answer;
          const isRemoved = removed_alternatives.includes(value);
          const showResult = selected_answer !== null;

          // Skip removed alternatives
          if (isRemoved) return null;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant={isSelected ? 'primary' : 'ghost'}
                onClick={() => !selected_answer && on_answer(value)}
                fullWidth
                disabled={!!selected_answer}
                sx={{ 
                  p: 3,
                  height: 'auto',
                  textAlign: 'left',
                  whiteSpace: 'normal',
                  bgcolor: showResult
                    ? isCorrect
                      ? alpha(theme.palette.success.main, 0.1)
                      : isSelected
                        ? alpha(theme.palette.error.main, 0.1)
                        : 'background.paper'
                    : 'background.paper',
                  borderColor: showResult
                    ? isCorrect
                      ? theme.palette.success.main
                      : isSelected
                        ? theme.palette.error.main
                        : theme.palette.divider
                    : isSelected
                      ? theme.palette.primary.main
                      : theme.palette.divider,
                  '&:hover': {
                    bgcolor: showResult
                      ? isCorrect
                        ? alpha(theme.palette.success.main, 0.2)
                        : isSelected
                          ? alpha(theme.palette.error.main, 0.2)
                          : alpha(theme.palette.primary.main, 0.1)
                      : alpha(theme.palette.primary.main, 0.1)
                  }
                }}
              >
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  {showResult && (
                    isCorrect ? (
                      <Check className="text-green-500" />
                    ) : isSelected ? (
                      <X className="text-red-500" />
                    ) : null
                  )}
                  <Typography variant="body1">
                    {value}
                  </Typography>
                </Box>
              </Button>
            </motion.div>
          );
        })}
      </Box>

      {/* Question Info */}
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        mt: 4,
        pt: 2,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="body2" color="text.secondary">
          Category: {question.category}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Difficulty: {question.difficulty}
        </Typography>
      </Box>
    </Box>
  );
}
