import React, { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container,
  useTheme,
  alpha,
  IconButton,
  Avatar,
  LinearProgress,
  Tooltip
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
  ArrowLeft,
  Beaker
} from 'lucide-react';
import Confetti from 'react-confetti';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase';
import Button from '../Button';
import { BattleQuestion, BattlePhase, BattleStatus, MatchState } from '../../types/battle';
import { BattleLobby } from './BattleLobby';
import { QuestionDisplay } from './QuestionDisplay';
import { BattleResults } from './BattleResults';
import { BATTLE_CONFIG } from '../../config/battleConfig';
import { LiveMatchmakingService } from '../../services/liveMatchmakingService';
import { BattleService } from '../../services/battleService';

interface BattleOptions {
  mode?: 'casual' | 'ranked';
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export default function BattleMode() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state } = useGame();
  const { showError, showSuccess } = useNotification();
  
  const [phase, setPhase] = useState<BattlePhase>(BattlePhase.INITIALIZING);
  const [currentQuestion, setCurrentQuestion] = useState<BattleQuestion | null>(null);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(BATTLE_CONFIG.time_per_question);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [opponent, setOpponent] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showLobby, setShowLobby] = useState(true);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [alternativesRemoved, setAlternativesRemoved] = useState<string[]>([]);

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
  useEffect(() => {
    if (!state.user) {
      navigate('/login');
      return;
    }
  }, []);

  const startMatchmaking = async (options: BattleOptions) => {
    if (!state.user) return;
    
    try {
      setIsSearching(true);
      const service = new LiveMatchmakingService();
      
      // Subscribe to matchmaking updates
      service.subscribeToMatchUpdates((matchState: MatchState) => {
        if (matchState.status === 'matched') {
          setOpponent(matchState.opponent);
          setMatchId(matchState.matchId);
          void initializeBattle(matchState.matchId);
        }
      });

      // Join the queue
      await service.joinMatchmakingQueue(state.user.id, {
        rating: state.battle_stats?.tournament_rating || BATTLE_CONFIG.matchmaking.default_rating,
        level: state.user.level || 1,
        preferences: options
      });

    } catch (error) {
      console.error('Matchmaking error:', error);
      showError('Failed to start matchmaking');
      setIsSearching(false);
    }
  };

  const startBotBattle = async (options: any) => {
    try {
      const botOpponent = await BattleService.get_bot_opponent(state.user.level || 1);
      setOpponent(botOpponent);
      initializeBattle();
    } catch (error) {
      console.error('Bot battle error:', error);
      showError('Failed to start bot battle');
    }
  };

  const initializeBattle = async (matchId?: string) => {
    try {
      setPhase(BattlePhase.PREPARING);
      
      // If it's a live match, get questions from the match state
      if (matchId) {
        const { data: matchData, error: matchError } = await supabase
          .from('battle_matches')
          .select('metadata')
          .eq('match_id', matchId)
          .single();

        if (matchError) throw matchError;
        setQuestions(matchData.metadata.questions);
      } else {
        // For bot matches, fetch new questions
        const { data: questions, error } = await supabase
          .from('battle_questions')
          .select('*')
          .order('id', { ascending: true })
          .limit(50) // Get a larger pool of questions
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
      }

      // Reset state
      setCurrentQuestionIndex(0);
      setCurrentQuestion(questions[0]);
      setTimeLeft(BATTLE_CONFIG.time_per_question);
      setScore({ player: 0, opponent: 0 });
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setStreak(0);
      setAlternativesRemoved([]);
      setShowLobby(false);
      setPhase(BattlePhase.READY);
    } catch (error) {
      console.error('Error initializing battle:', error);
      showError('Failed to initialize battle');
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

    // Simulate opponent's answer based on bot accuracy
    const opponentAccuracy = BATTLE_CONFIG.bot.base_accuracy + 
      (BATTLE_CONFIG.bot.accuracy_multiplier * (opponent?.rating || BATTLE_CONFIG.matchmaking.default_rating) / 1000);
    const opponentCorrect = Math.random() < opponentAccuracy;
    if (opponentCorrect) {
      setScore(prev => ({ ...prev, opponent: prev.opponent + 1 }));
    }

    // Wait for animation and proceed to next question
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setAlternativesRemoved([]);
    
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

  const handleUseAlternativeRemover = () => {
    if (!currentQuestion || selectedAnswer || alternativesRemoved.length > 0) return;

    // Get incorrect alternatives
    const alternatives = ['alternative_a', 'alternative_b', 'alternative_c', 'alternative_d']
      .map(key => currentQuestion[key as keyof BattleQuestion] as string)
      .filter(alt => alt !== currentQuestion.correct_answer);

    // Randomly select two incorrect alternatives to remove
    const shuffled = [...alternatives].sort(() => Math.random() - 0.5);
    const toRemove = shuffled.slice(0, 2);

    setAlternativesRemoved(toRemove);
    showSuccess('Removed 2 incorrect alternatives!');
  };

  if (showLobby) {
    return (
      <BattleLobby
        on_start_battle={startBotBattle}
        on_close={() => navigate(-1)}
        stats={state.battle_stats || {
          total_battles: 0,
          wins: 0,
          losses: 0,
          win_streak: 0,
          highest_streak: 0,
          difficulty: 1,
          average_score: 0
        }}
      />
    );
  }

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

        {/* Player vs Opponent Display */}
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          p: 2,
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: 1
        }}>
          {/* Player */}
          <Box sx={{ textAlign: 'center' }}>
            <Avatar 
              src={state.user?.avatar_url || '/default-avatar.png'} 
              sx={{ width: 48, height: 48, mb: 1 }}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {state.user?.name || 'Player'}
            </Typography>
            {state.user?.title && (
              <Typography variant="caption" color="primary">
                {state.user.title}
              </Typography>
            )}
          </Box>

          {/* VS */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1
          }}>
            <Typography variant="h6" color="text.secondary">
              VS
            </Typography>
            <Box sx={{ 
              display: 'flex',
              gap: 1,
              py: 0.5,
              px: 2,
              borderRadius: 'full',
              bgcolor: alpha(theme.palette.primary.main, 0.1)
            }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {score.player}
              </Typography>
              <Typography variant="h5" color="text.secondary">
                -
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                {score.opponent}
              </Typography>
            </Box>
          </Box>

          {/* Opponent */}
          <Box sx={{ textAlign: 'center' }}>
            <Avatar 
              src={opponent?.avatar_url || '/bot-avatar.png'} 
              sx={{ width: 48, height: 48, mb: 1 }}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {opponent?.name || 'Opponent'}
            </Typography>
            {opponent?.title && (
              <Typography variant="caption" color="primary">
                {opponent.title}
              </Typography>
            )}
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
              <LinearProgress 
                sx={{ 
                  width: '200px',
                  height: 8,
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'primary.main',
                    borderRadius: 4
                  }
                }}
              />
              <Typography variant="body1" color="text.secondary">
                Preparing your battle...
              </Typography>
            </motion.div>
          )}

          {phase === BattlePhase.READY && currentQuestion && (
            <QuestionDisplay
              question={currentQuestion}
              on_answer={handleAnswer}
              selected_answer={selectedAnswer}
              is_correct={isAnswerCorrect}
              time_left={timeLeft}
              removed_alternatives={alternativesRemoved}
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
          <Tooltip title="Remove 2 incorrect alternatives">
            <span>
              <Button
                variant="ghost"
                startIcon={<Beaker size={18} />}
                disabled={phase !== BattlePhase.READY || !!selectedAnswer || alternativesRemoved.length > 0}
                onClick={handleUseAlternativeRemover}
              >
                50/50
              </Button>
            </span>
          </Tooltip>
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