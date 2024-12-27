import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Paper, useTheme, alpha } from '@mui/material';
import { ArrowLeft, Timer, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../contexts/GameContext';
import { BattleItemDisplay } from './BattleItemDisplay';
import { QuestionDisplay } from './QuestionDisplay';
import { BattleResults } from './BattleResults';
import { Player, BattlePhase, BattleQuestion } from '../../types/battle';
import { BATTLE_CONFIG } from '../../config/battleConfig';
import { supabase } from '../../lib/supabase';
import { useInventory } from '../../hooks/useInventory';

interface BattleArenaProps {
  opponent: Player;
  matchId: string;
  onExit: () => void;
}

export function BattleArena({ opponent, matchId, onExit }: BattleArenaProps) {
  const theme = useTheme();
  const { state } = useGame();
  const { inventory } = useInventory();
  
  const [phase, setPhase] = useState<BattlePhase>(BattlePhase.INITIALIZING);
  const [currentQuestion, setCurrentQuestion] = useState<BattleQuestion | null>(null);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(BATTLE_CONFIG.time_per_question);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);

  // Initialize battle
  useEffect(() => {
    initializeBattle();
  }, []);

  // Timer effect
  useEffect(() => {
    if (phase !== BattlePhase.READY || !currentQuestion || selectedAnswer) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAnswer('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, currentQuestion, selectedAnswer]);

  const initializeBattle = async () => {
    try {
      setPhase(BattlePhase.PREPARING);
      
      // Fetch questions from the database
      const { data: questions, error } = await supabase
        .from('battle_questions')
        .select('*')
        .order('id', { ascending: true })
        .limit(50)
        .then(({ data, error }) => {
          if (error) return { data: null, error };
          if (data && data.length > 0) {
            const shuffled = [...data].sort(() => Math.random() - 0.5);
            return { 
              data: shuffled.slice(0, BATTLE_CONFIG.questions_per_battle),
              error: null 
            };
          }
          return { data: null, error: new Error('No questions available') };
        });

      if (error) throw error;
      if (!questions || questions.length === 0) {
        throw new Error('No questions available');
      }

      setQuestions(questions);
      setCurrentQuestionIndex(0);
      setCurrentQuestion(questions[0]);
      setTimeLeft(BATTLE_CONFIG.time_per_question);
      setScore({ player: 0, opponent: 0 });
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setStreak(0);
      setPhase(BattlePhase.READY);
    } catch (error) {
      console.error('Error initializing battle:', error);
      setPhase(BattlePhase.ERROR);
    }
  };

  const handleAnswer = async (answer: string) => {
    if (!currentQuestion || selectedAnswer) return;

    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.correct_answer;
    setIsAnswerCorrect(correct);

    if (correct) {
      setScore(prev => ({ ...prev, player: prev.player + 1 }));
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    // Simulate opponent's answer
    const opponentAccuracy = opponent.is_bot
      ? BATTLE_CONFIG.bot.base_accuracy + 
        (BATTLE_CONFIG.bot.accuracy_multiplier * (opponent.rating || BATTLE_CONFIG.matchmaking.default_rating) / 1000)
      : 0.7; // Default accuracy for human opponents
    
    const opponentCorrect = Math.random() < opponentAccuracy;
    if (opponentCorrect) {
      setScore(prev => ({ ...prev, opponent: prev.opponent + 1 }));
    }

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    
    // Move to next question or end battle
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentQuestion(questions[currentQuestionIndex + 1]);
      setTimeLeft(BATTLE_CONFIG.time_per_question);
    } else {
      setPhase(BattlePhase.COMPLETED);
    }
  };

  const handleUseItem = (item: any) => {
    // Handle item usage based on effect type
    if (item.effects?.some((effect: any) => effect.type === 'eliminate_wrong_answer')) {
      // Logic for eliminating wrong answers will be handled in QuestionDisplay
      console.log('Using elimination potion');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Battle Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={onExit}
            sx={{ 
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': { bgcolor: 'background.paper' }
            }}
          >
            <ArrowLeft />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Battle Arena
            </Typography>
            <Typography variant="body1" color="text.secondary">
              VS {opponent.name}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {/* Timer */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 1,
            px: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.2)
          }}>
            <Timer size={20} className="text-primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {timeLeft}s
            </Typography>
          </Box>

          {/* Score */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            py: 1,
            px: 2,
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: 1
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {score.player}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                You
              </Typography>
            </Box>
            <Typography variant="h5" color="text.secondary" sx={{ px: 1 }}>
              vs
            </Typography>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                {score.opponent}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {opponent.name}
              </Typography>
            </Box>
          </Box>

          {/* Streak */}
          {streak > 0 && (
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 1,
              px: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              border: '1px solid',
              borderColor: alpha(theme.palette.warning.main, 0.2)
            }}>
              <Zap size={20} className="text-yellow-500" />
              <Typography sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                {streak}x
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Battle Content */}
      <Box sx={{ 
        position: 'relative',
        minHeight: '60vh',
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: 1,
        overflow: 'hidden',
        display: 'flex'
      }}>
        {/* Battle Items */}
        <Box sx={{ 
          width: 80,
          borderRight: '1px solid',
          borderColor: 'divider',
          p: 2
        }}>
          <BattleItemDisplay
            items={inventory}
            onUseItem={handleUseItem}
            disabled={phase !== BattlePhase.READY || !!selectedAnswer}
          />
        </Box>

        {/* Question Area */}
        <Box sx={{ flex: 1, p: 4 }}>
          <AnimatePresence mode="wait">
            {phase === BattlePhase.READY && currentQuestion && (
              <QuestionDisplay
                question={currentQuestion}
                onAnswer={handleAnswer}
                selectedAnswer={selectedAnswer}
                isCorrect={isAnswerCorrect}
                timeLeft={timeLeft}
              />
            )}

            {phase === BattlePhase.COMPLETED && (
              <BattleResults
                score={score}
                streak={streak}
                onPlayAgain={initializeBattle}
                onExit={onExit}
              />
            )}
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
} 