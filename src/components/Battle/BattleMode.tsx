import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../contexts/GameContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBattle } from '../../hooks/useBattle';
import QuestionDisplay from './QuestionDisplay';
import Timer from './Timer';
import ScoreDisplay from './ScoreDisplay';
import BattleStateTransition from './BattleStateTransition';
import BattleResults from './BattleResults';
import BattleStats from './BattleStats';
import { BattleResults as BattleResultsType } from '../../types/battle';
import Confetti from 'react-confetti';
import Button from '../Button';
import { BATTLE_CONFIG } from '../../config/battleConfig';
import LootBox from '../LootBox';
import { Reward } from '../../types/rewards';
import { RewardService } from '../../services/rewardService';
import { useBattleStreak } from '../../hooks/useBattleStreak';
import { Trophy } from 'lucide-react';
import Modal from '../Modal';

interface BattleModeProps {
  onClose: () => void;
}

export default function BattleMode({ onClose }: BattleModeProps) {
  const { t } = useLanguage();
  const { state } = useGame();
  const { initializeBattle, handleAnswer } = useBattle();
  const { handleBattleResult } = useBattleStreak();
  
  const [error, setError] = useState<Error | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [opponent, setOpponent] = useState<{ name: string; rating: number } | null>(null);
  const [currentRewards, setCurrentRewards] = useState<Reward[]>([]);

  const getBattleRewards = async (isVictory: boolean) => {
    const baseRewards = RewardService.createBattleRewards(
      state.battle.rewards?.experienceGained || 0,
      state.battle.rewards?.coinsEarned || 0,
      state.battle.score.player >= state.battle.questions.length,
      state.battle.rewards?.streakBonus
    );

    const streakRewards = await handleBattleResult(isVictory);
    return [...baseRewards, ...streakRewards];
  };

  useEffect(() => {
    const init = async () => {
      try {
        const autoOpponent = {
          name: `Bot_${Math.floor(Math.random() * 1000)}`,
          rating: state.battleRating + (Math.random() * 200 - 100)
        };
        setOpponent(autoOpponent);
        
        await initializeBattle();
        setShowStats(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Battle initialization failed'));
      }
    };
    init();

    return () => {
      setShowConfetti(false);
    };
  }, []);

  useEffect(() => {
    if (state.battle.status === 'completed') {
      const isVictory = state.battle.score.player > state.battle.score.opponent;
      getBattleRewards(isVictory).then(setCurrentRewards);
      
      if (isVictory) {
        setShowConfetti(true);
      }
    }
  }, [state.battle.status]);

  const handleQuestionAnswer = async (index: number) => {
    try {
      await handleAnswer(index);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to process answer'));
    }
  };

  const renderContent = () => {
    if (showStats) {
      return (
        <div className="space-y-6">
          <BattleStats />
          <div className="flex justify-end space-x-4">
            <Button 
              variant="primary" 
              onClick={() => setShowStats(false)}
              className="px-6 py-2"
            >
              {t('battle.startBattle')}
            </Button>
          </div>
        </div>
      );
    }

    switch (state.battle.status) {
      case 'searching':
      case 'ready':
        return (
          <BattleStateTransition 
            status={state.battle.status}
            message={state.battle.status === 'searching' ? t('battle.searching') : t('battle.getReady')}
            subMessage={state.battle.status === 'searching' ? t('battle.searchingDesc') : undefined}
          />
        );

      case 'battle':
        return (
          <div className="space-y-6">
            <ScoreDisplay
              playerScore={state.battle.score.player}
              opponentScore={state.battle.score.opponent}
              streak={state.user.streak}
              timeLeft={state.battle.timeLeft}
            />
            
            <Timer 
              timeLeft={state.battle.timeLeft} 
              totalTime={BATTLE_CONFIG.timePerQuestion}
            />
            <QuestionDisplay
              question={state.battle.questions[state.battle.currentQuestion]}
              onAnswer={handleQuestionAnswer}
              timeLeft={state.battle.timeLeft}
              disabled={state.battle.status !== 'battle'}
            />
          </div>
        );

      case 'completed':
        return (
          <>
            {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
            <LootBox
              isOpen={state.battle.status === 'completed'}
              onClose={onClose}
              rewards={currentRewards}
              source="battle"
            />
            <BattleResults 
              results={{
                isVictory: state.battle.score.player > state.battle.score.opponent,
                playerScore: state.battle.playerAnswers.filter(a => a).length,
                totalQuestions: state.battle.questions.length,
                totalScore: state.battle.questions.length,
                score: state.battle.playerAnswers.filter(a => a).length,
                experienceGained: state.battle.rewards?.experienceGained || 0,
                xpEarned: state.battle.rewards?.experienceGained || 0,
                coinsEarned: state.battle.rewards?.coinsEarned || 0,
                streakBonus: state.battle.rewards?.streakBonus || 0,
                timeBonus: state.battle.rewards?.timeBonus || 0,
                scorePercentage: (state.battle.playerAnswers.filter(a => a).length / state.battle.questions.length) * 100,
                rewards: {
                  items: [], 
                  achievements: state.battle.rewards?.achievements || [],
                  bonuses: [
                    {
                      type: 'streak',
                      amount: state.battle.rewards?.streakBonus || 0
                    },
                    {
                      type: 'time',
                      amount: state.battle.rewards?.timeBonus || 0
                    }
                  ]
                }
              }}
              onClose={onClose} 
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('battle.title')}
      maxWidth="max-w-4xl"
    >
      {error ? (
        <div className="text-center py-8">
          <h2 className="text-xl font-bold text-red-500 mb-4">{error.message}</h2>
          <Button variant="primary" onClick={() => window.location.reload()}>
            {t('common.retry')}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Battle Header with Stats Toggle */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {opponent && (
                <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                  vs {opponent.name} ({opponent.rating})
                </span>
              )}
            </div>
            {!showStats && (
              <Button
                variant="secondary"
                onClick={() => setShowStats(true)}
                className="flex items-center space-x-2"
              >
                <Trophy className="h-4 w-4" />
                <span>{t('battle.viewStats')}</span>
              </Button>
            )}
          </div>

          {/* Battle Content */}
          {renderContent()}
        </div>
      )}
    </Modal>
  );
}