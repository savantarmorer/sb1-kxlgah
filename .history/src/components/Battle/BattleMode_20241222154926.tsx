import React, { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container,
  useTheme,
  alpha,
  IconButton,
  Avatar,
  LinearProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords,
  Timer,
  Trophy,
  Star,
  Shield,
  Zap,
  Crown,
  User,
  ArrowLeft
} from 'lucide-react';
import Confetti from 'react-confetti';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase';
import Button from '../Button';
import { BattleQuestion, BattlePhase, BattleStatus } from '../../types/battle';
import { PreBattleLobby } from './PreBattleLobby';
import { QuestionDisplay } from './QuestionDisplay';
import { BattleResults } from './BattleResults';
import { BATTLE_CONFIG } from '../../config/battleConfig';

export default function BattleMode() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state } = useGame();
  const { showError } = useNotification();
  
  const [phase, setPhase] = useState<BattlePhase>(BattlePhase.PREPARING);
  const [currentQuestion, setCurrentQuestion] = useState<BattleQuestion | null>(null);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(BATTLE_CONFIG.time_per_question);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);

  // Check authentication on mount
  useEffect(() => {
    if (!state.user) {
      navigate('/login');
    }
  }, [state.user, navigate]);

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

  // Battle initialization
  const initializeBattle = useCallback(async () => {
    try {
      setPhase(BattlePhase.INITIALIZING);
      
      // Fetch questions from Supabase with correct random ordering
      const { data: questions, error } = await supabase
        .from('battle_questions')
        .select('*')
        .limit(BATTLE_CONFIG.questions_per_battle)
        .order('id', { ascending: false }); // This ensures consistent ordering

      if (error) throw error;
      
      if (!questions || questions.length === 0) {
        throw new Error('No questions available');
      }

      // Shuffle the questions array locally
      const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);

      setQuestions(shuffledQuestions);
      setCurrentQuestion(shuffledQuestions[0]);
      setCurrentQuestionIndex(0);
      setTimeLeft(BATTLE_CONFIG.time_per_question);
      setScore({ player: 0, opponent: 0 });
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setStreak(0);
      
      // Small delay before setting phase to READY
      setTimeout(() => {
        setPhase(BattlePhase.READY);
      }, 500);
    } catch (error) {
      console.error('Error initializing battle:', error);
      showError('Failed to initialize battle');
      setPhase(BattlePhase.ERROR);
    }
  }, [showError]);

  const handleBattleStart = useCallback(async () => {
    try {
      await initializeBattle();
    } catch (error) {
      console.error('Error starting battle:', error);
      showError('Failed to start battle');
      setPhase(BattlePhase.ERROR);
    }
  }, [initializeBattle, showError]);

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

    // Simulate opponent's answer based on bot accuracy
    const opponentAccuracy = BATTLE_CONFIG.bot.base_accuracy + 
      (BATTLE_CONFIG.bot.accuracy_multiplier * (state.battleRatings?.rating || BATTLE_CONFIG.matchmaking.default_rating) / 1000);
    const opponentCorrect = Math.random() < opponentAccuracy;
    if (opponentCorrect) {
      setScore(prev => ({ ...prev, opponent: prev.opponent + 1 }));
    }

    // Wait for animation and proceed to next question
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
      if (score.player > score.opponent) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Battle Header */}
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 4
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={() => navigate(-1)}
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
              Battle Mode
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Test your knowledge in real-time battles
            </Typography>
          </Box>
        </Box>

        {phase === BattlePhase.READY && (
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
                  Opponent
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
        )}
      </Box>

      {/* Battle Content */}
      <Box sx={{ 
        position: 'relative',
        minHeight: '60vh',
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: 1,
        overflow: 'hidden'
      }}>
        <AnimatePresence mode="wait">
          {phase === BattlePhase.INITIALIZING && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <Swords size={48} className="text-primary animate-pulse" />
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Initializing Battle...
              </Typography>
            </motion.div>
          )}

          {phase === BattlePhase.PREPARING && (
            <PreBattleLobby
              onBattleStart={handleBattleStart}
              onCancel={() => navigate(-1)}
            />
          )}

          {phase === BattlePhase.READY && currentQuestion && (
            <QuestionDisplay
              question={currentQuestion}
              on_answer={handleAnswer}
              selected_answer={selectedAnswer}
              is_correct={isAnswerCorrect}
              time_left={timeLeft}
            />
          )}

          {phase === BattlePhase.COMPLETED && (
            <BattleResults
              score={score}
              streak={streak}
              on_play_again={initializeBattle}
              on_exit={() => navigate('/battle')}
            />
          )}
        </AnimatePresence>
      </Box>

      {/* Battle Footer - Stats & Powerups */}
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mt: 4,
        gap: 2
      }}>
        {/* Battle Stats */}
        <Box sx={{ 
          display: 'flex',
          gap: 2
        }}>
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 1,
            px: 2,
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: 1
          }}>
            <Trophy size={20} className="text-yellow-500" />
            <Typography variant="body2" color="text.secondary">
              Wins: <span className="font-bold">{state.battle_stats?.wins || 0}</span>
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 1,
            px: 2,
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: 1
          }}>
            <Star size={20} className="text-purple-500" />
            <Typography variant="body2" color="text.secondary">
              Rating: <span className="font-bold">{state.battle_stats?.rating || BATTLE_CONFIG.matchmaking.default_rating}</span>
            </Typography>
          </Box>
        </Box>

        {/* Powerups */}
        <Box sx={{ 
          display: 'flex',
          gap: 2
        }}>
          <Button
            variant="ghost"
            startIcon={<Shield size={18} />}
            disabled={phase !== BattlePhase.READY}
          >
            50/50
          </Button>
          <Button
            variant="ghost"
            startIcon={<Timer size={18} />}
            disabled={phase !== BattlePhase.READY}
          >
            +15s
          </Button>
        </Box>
      </Box>

      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
            gravity={0.3}
          />
        )}
      </AnimatePresence>
    </Container>
  );
}