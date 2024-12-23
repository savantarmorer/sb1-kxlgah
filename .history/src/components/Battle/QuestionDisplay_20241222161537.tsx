import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import Button from '../Button';
import type { BattleQuestion } from '../../types/battle';

interface QuestionDisplayProps {
  question: BattleQuestion;
  onAnswer: (answer: string) => void;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  timeLeft: number;
  disabled?: boolean;
}

export function QuestionDisplay({
  question,
  onAnswer,
  selectedAnswer,
  isCorrect,
  timeLeft,
  disabled = false
}: QuestionDisplayProps) {
  const theme = useTheme();

  const getAnswerButtonStyle = (answer: string) => {
    if (!selectedAnswer) {
      return {
        bgcolor: 'background.paper',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.1)
        }
      };
    }

    if (selectedAnswer === answer) {
      if (isCorrect === null) {
        return {
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          borderColor: theme.palette.primary.main
        };
      }
      return {
        bgcolor: isCorrect 
          ? alpha(theme.palette.success.main, 0.1)
          : alpha(theme.palette.error.main, 0.1),
        borderColor: isCorrect 
          ? theme.palette.success.main 
          : theme.palette.error.main,
        '&:hover': {
          bgcolor: isCorrect 
            ? alpha(theme.palette.success.main, 0.2)
            : alpha(theme.palette.error.main, 0.2)
        }
      };
    }

    if (answer === question.correct_answer && selectedAnswer) {
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
    if (selectedAnswer !== answer) return null;
    if (isCorrect === null) return null;

    return isCorrect ? (
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
      {/* Question */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 'bold',
            mb: 1
          }}
        >
          {question.question}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          Category: {question.category} | Difficulty: {question.difficulty}
        </Typography>
      </Box>

      {/* Answers */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 2
      }}>
        {['a', 'b', 'c', 'd'].map((answer) => (
          <motion.div
            key={answer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: Number(answer.charCodeAt(0) - 97) * 0.1 }}
          >
            <Button
              fullWidth
              variant="outline"
              onClick={() => !selectedAnswer && onAnswer(answer)}
              disabled={!!selectedAnswer || (question.eliminated_options?.includes(answer) ?? false)}
              sx={{
                p: 2,
                height: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
                ...getAnswerButtonStyle(answer)
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  Option {answer.toUpperCase()}
                </Typography>
                <Typography>
                  {getAnswerText(answer)}
                </Typography>
              </Box>
              {getAnswerIcon(answer)}
            </Button>
          </motion.div>
        ))}
      </Box>
    </Box>
  );
}
