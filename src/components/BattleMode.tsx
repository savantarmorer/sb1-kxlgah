import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Timer, Trophy, XCircle, Star, Flame } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBattle } from '../hooks/useBattle';
import Confetti from 'react-confetti';
import Button from './Button';

interface BattleModeProps {
  onClose: () => void;
}

export default function BattleMode({ onClose }: BattleModeProps) {
  const { t } = useLanguage();
  const { battleState, handleAnswer, endBattle } = useBattle();
  const [showConfetti, setShowConfetti] = useState(false);
  const [battleResults, setBattleResults] = useState<any>(null);

  // Handle battle completion
  useEffect(() => {
    if (battleState.status === 'completed' && !battleResults) {
      const results = endBattle();
      setBattleResults(results);
      if (results.isVictory) {
        setShowConfetti(true);
      }
    }
  }, [battleState.status, battleResults, endBattle]);

  const handleAnswerClick = (answerIndex: number) => {
    handleAnswer(answerIndex);
  };

  const renderBattleContent = () => {
    switch (battleState.status) {
      case 'searching':
        return (
          <div className="text-center py-8">
            <Swords size={48} className="mx-auto mb-4 text-brand-teal-500 dark:text-brand-teal-400 animate-pulse" />
            <h2 className="heading text-2xl mb-2">{t('battle.searching')}</h2>
            <p className="text-muted">{t('battle.searchingDesc')}</p>
          </div>
        );

      case 'ready':
        return (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="heading text-4xl text-brand-teal-600 dark:text-brand-teal-400">
                {t('battle.getReady')}
              </h2>
            </motion.div>
          </div>
        );

      case 'battle':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {battleState.score.player} - {battleState.score.opponent}
              </div>
              <div className="flex items-center space-x-2 text-lg">
                <Timer className="text-red-500" />
                <span className="text-gray-900 dark:text-white">{battleState.timeLeft}s</span>
              </div>
            </div>

            {battleState.questions[battleState.currentQuestion] && (
              <div className="card">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  {battleState.questions[battleState.currentQuestion].question}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {battleState.questions[battleState.currentQuestion].answers.map((answer, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleAnswerClick(index)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-brand-teal-50 hover:border-brand-teal-300 dark:hover:bg-brand-teal-900/20 dark:hover:border-brand-teal-700 transition-colors text-gray-900 dark:text-white"
                    >
                      {answer}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'completed':
        if (!battleResults) return null;
        
        return (
          <div className="text-center py-8">
            {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
            
            {battleResults.isVictory ? (
              <>
                <Trophy size={48} className="mx-auto mb-4 text-yellow-500" />
                <h2 className="heading text-3xl text-yellow-500 mb-4">{t('battle.victory')}</h2>
              </>
            ) : (
              <>
                <XCircle size={48} className="mx-auto mb-4 text-gray-500 dark:text-gray-400" />
                <h2 className="heading text-3xl mb-4">{t('battle.defeat')}</h2>
              </>
            )}

            <div className="space-y-4 mb-6">
              <div className="bg-white/10 dark:bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                  {t('battle.results.title')}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">{t('battle.correctAnswers')}:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {battleResults.score}/{battleResults.totalQuestions}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">{t('battle.xpGained')}:</span>
                    <div className="flex items-center space-x-2">
                      <Star className="text-brand-teal-500" size={16} />
                      <span className="font-bold text-brand-teal-600 dark:text-brand-teal-400">
                        +{battleResults.xpEarned} XP
                      </span>
                      {battleResults.streakBonus > 0 && (
                        <span className="text-sm text-orange-500">
                          (+{battleResults.streakBonus} streak bonus)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">{t('battle.coinsGained')}:</span>
                    <span className="font-bold text-yellow-600 dark:text-yellow-400">
                      +{battleResults.coinsEarned}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={onClose}
            >
              {t('common.continue')}
            </Button>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4"
        >
          {renderBattleContent()}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}