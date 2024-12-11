import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BattleQuestion } from '../../types/battle';
import { use_game } from '../../contexts/GameContext';

interface QuestionDisplayProps {
  question: BattleQuestion | null;
  on_answer: (answer: 'A' | 'B' | 'C' | 'D') => void;
  disabled?: boolean;
}

function QuestionDisplay({ 
  question, 
  on_answer,
  disabled 
}: QuestionDisplayProps) {
  const { state } = use_game();
  const battle = state.battle;

  // Memoized answer handler to prevent re-renders
  const handleAnswer = useCallback((key: 'A' | 'B' | 'C' | 'D') => {
    if (!disabled && battle?.status === 'active') {
      on_answer(key);
    }
  }, [disabled, battle?.status, on_answer]);

  // Show loading state if no question
  if (!question) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Map alternatives to array for easier rendering
  const alternatives = [
    { key: 'A', value: question.alternative_a },
    { key: 'B', value: question.alternative_b },
    { key: 'C', value: question.alternative_c },
    { key: 'D', value: question.alternative_d }
  ].filter(alt => alt.value && alt.value !== ''); // Remove empty alternatives

  return (
    <div className="space-y-6">
      {/* Question Text */}
      <div className="text-lg font-medium dark:text-white p-4 bg-white dark:bg-gray-800 rounded-lg">
        {question.question || 'Loading question...'}
      </div>

      {/* Alternatives */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="wait">
          {alternatives.map(({ key, value }) => (
            <motion.button
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className={`
                w-full p-4 text-left rounded-lg border transition-all
                ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-brand-teal-500 hover:bg-brand-teal-50 dark:hover:bg-brand-teal-900/20'}
                ${battle?.selectedAnswer === key ? 'border-brand-teal-500 bg-brand-teal-50 dark:bg-brand-teal-900/20' : 'border-gray-200 dark:border-gray-700'}
                bg-white dark:bg-gray-800
              `}
              onClick={() => handleAnswer(key as 'A' | 'B' | 'C' | 'D')}
              disabled={disabled || battle?.status !== 'active'}
            >
              <div className="flex items-start space-x-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-teal-100 dark:bg-brand-teal-900/30 text-brand-teal-600 dark:text-brand-teal-400 font-medium">
                  {key}
                </span>
                <span className="flex-1 dark:text-white">{value}</span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export { QuestionDisplay };
