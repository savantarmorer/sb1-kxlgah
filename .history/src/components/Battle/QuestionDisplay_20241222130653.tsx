import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import Button from '../Button';
import type { BattleQuestion } from '../../types/battle';

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
        {question.hint && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <span className="text-yellow-500">Hint:</span> {question.hint}
          </Typography>
        )}
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
              onClick={() => !selected_answer && on_answer(answer)}
              disabled={!!selected_answer}
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
                  {question[`alternative_${answer}` as keyof BattleQuestion]}
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
