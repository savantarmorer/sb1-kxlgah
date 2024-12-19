import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Target, BookOpen } from 'lucide-react';
import { use_language } from '../../contexts/LanguageContext';
import type { BattleQuestion } from '../../types/battle';

interface QuestionDisplayProps {
  question: BattleQuestion;
  on_answer: (answer: string) => void;
  disabled?: boolean;
}

export function QuestionDisplay({ question, on_answer, disabled }: QuestionDisplayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const { t } = use_language();

  useEffect(() => {
    setSelectedAnswer(null);
  }, [question.id]);

  const options = [
    { id: 'A', text: question.alternative_a },
    { id: 'B', text: question.alternative_b },
    { id: 'C', text: question.alternative_c },
    { id: 'D', text: question.alternative_d }
  ].filter(option => option.text);

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Question Text */}
      <div className="space-y-4">
        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl font-semibold text-white"
        >
          {question.question}
        </motion.h3>
      </div>

      {/* Answer Options */}
      <div className="grid grid-cols-1 gap-3">
        {options.map((option, index) => (
          <motion.button
            key={`${question.id}-${option.id}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              transition: { delay: index * 0.1 }
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (!disabled && !selectedAnswer) {
                setSelectedAnswer(option.id);
                on_answer(option.id);
              }
            }}
            disabled={disabled || selectedAnswer !== null}
            className={`
              relative p-4 rounded-lg text-left transition-all
              ${selectedAnswer === option.id 
                ? 'bg-indigo-500/20 border-indigo-500 text-white ring-2 ring-indigo-500/50 ring-offset-2 ring-offset-[#0f172a]' 
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              border backdrop-blur-sm group
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium
                transition-colors duration-200
                ${selectedAnswer === option.id 
                  ? 'bg-indigo-500 text-white' 
                  : 'bg-white/10 text-gray-400 group-hover:bg-white/20'}
              `}>
                {option.id}
              </div>
              <span className="flex-1">{option.text}</span>
            </div>

            {selectedAnswer === option.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-2 -top-2"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Question Footer */}
      <div className="flex justify-between items-center text-sm text-gray-400 mt-4 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" />
          <span>{t('battle.difficulty')}: {question.difficulty}</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          <span>{question.category}</span>
        </div>
      </div>
    </motion.div>
  );
}
