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
import { BattleActions } from './BattleActions';
import { PlayerState, BattleAction, ACTION_ADVANTAGES, initialPlayerState } from '../../types/battle';

type BattleMode = 'all' | 'constitutional' | 'criminal' | 'civil';

interface BattleModeProps {
  mode?: BattleMode;
}

export default function BattleMode({ mode = 'all' }: BattleModeProps) {
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
  const [selectedMode, setSelectedMode] = useState<BattleMode>(mode);
  const [playerState, setPlayerState] = useState<PlayerState>({ ...initialPlayerState });
  const [opponentState, setOpponentState] = useState<PlayerState>({ ...initialPlayerState });

  // Check authentication on mount
  useEffect(() => {
    if (!state.user) {
      navigate('/login');
    }
  }, [state.user, navigate]);

  // Timer effect - update to handle individual timers
  useEffect(() => {
    if (phase !== BattlePhase.READY || !currentQuestion || playerState.isReady) return;

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
  }, [phase, currentQuestion, playerState.isReady]);

  // Battle initialization
  const initializeBattle = useCallback(async () => {
    try {
      setPhase(BattlePhase.INITIALIZING);
      
      // Build the query based on selected mode
      let query = supabase
        .from('battle_questions')
        .select('*')
        .limit(BATTLE_CONFIG.questions_per_battle);

      // Add category filter if not 'all'
      if (selectedMode !== 'all') {
        query = query.eq('category', selectedMode);
      }

      // Get questions
      const { data: questions, error } = await query.order('id', { ascending: false });

      if (error) throw error;
      
      if (!questions || questions.length === 0) {
        throw new Error(`No questions available for ${selectedMode} mode`);
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
  }, [showError, selectedMode]);

  const handleBattleStart = useCallback(async () => {
    try {
      await initializeBattle();
    } catch (error) {
      console.error('Error starting battle:', error);
      showError('Failed to start battle');
      setPhase(BattlePhase.ERROR);
    }
  }, [initializeBattle, showError]);

  const handleSelectAction = (action: BattleAction) => {
    setPlayerState(prev => ({
      ...prev,
      selectedAction: action
    }));
  };

  const handleReady = () => {
    if (!playerState.selectedAction || !selectedAnswer) return;

    setPlayerState(prev => ({
      ...prev,
      isReady: true,
      timeLeft: timeLeft
    }));

    // Simulate opponent's action and readiness
    const botAction = Object.keys(ACTION_ADVANTAGES)[Math.floor(Math.random() * 3)] as BattleAction;
    const botTimeLeft = Math.floor(Math.random() * timeLeft);
    
    setOpponentState(prev => ({
      ...prev,
      selectedAction: botAction,
      isReady: true,
      timeLeft: botTimeLeft
    }));
  };

  const calculateDamage = (attacker: PlayerState, defender: PlayerState): number => {
    if (!attacker.isCorrect) return 0;
    
    const damage = attacker.timeLeft;
    const defense = defender.isCorrect ? defender.timeLeft + defender.shield : defender.shield;
    
    return Math.max(0, damage - defense);
  };

  const handleAnswer = async (answer: string) => {
    if (!currentQuestion || playerState.isReady) return;

    const isCorrect = answer.toUpperCase() === currentQuestion.correct_answer.toUpperCase();
    
    setPlayerState(prev => ({
      ...prev,
      answer,
      isCorrect
    }));

    // Simulate opponent's answer
    const opponentAccuracy = BATTLE_CONFIG.bot.base_accuracy + 
      (BATTLE_CONFIG.bot.accuracy_multiplier * (state.battleRatings?.rating || BATTLE_CONFIG.matchmaking.default_rating) / 1000);
    const opponentCorrect = Math.random() < opponentAccuracy;
    
    setOpponentState(prev => ({
      ...prev,
      isCorrect: opponentCorrect
    }));

    // Process battle round when both players are ready
    if (playerState.isReady && opponentState.isReady) {
      await processBattleRound();
    }
  };

  const processBattleRound = async () => {
    if (!playerState.selectedAction || !opponentState.selectedAction) return;

    // Determine attacker and defender based on action advantages
    const playerAdvantage = ACTION_ADVANTAGES[playerState.selectedAction] === opponentState.selectedAction;
    const opponentAdvantage = ACTION_ADVANTAGES[opponentState.selectedAction] === playerState.selectedAction;

    let newPlayerState = { ...playerState };
    let newOpponentState = { ...opponentState };

    if (playerAdvantage) {
      // Player attacks
      const damage = calculateDamage(playerState, opponentState);
      newOpponentState.health -= damage;
      newOpponentState.shield = Math.max(0, opponentState.timeLeft - damage);
    } else if (opponentAdvantage) {
      // Opponent attacks
      const damage = calculateDamage(opponentState, playerState);
      newPlayerState.health -= damage;
      newPlayerState.shield = Math.max(0, playerState.timeLeft - damage);
    } else {
      // Both players failed or tied
      if (!playerState.isCorrect && !opponentState.isCorrect) {
        newPlayerState.health -= 10;
        newOpponentState.health -= 10;
      }
    }

    // Update states
    setPlayerState(newPlayerState);
    setOpponentState(newOpponentState);

    // Check for battle end
    if (newPlayerState.health <= 0 || newOpponentState.health <= 0) {
      setPhase(BattlePhase.COMPLETED);
      if (newOpponentState.health <= 0) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
      return;
    }

    // Prepare for next round
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentQuestion(questions[currentQuestionIndex + 1]);
      setTimeLeft(BATTLE_CONFIG.time_per_question);
      setPlayerState(prev => ({
        ...prev,
        selectedAction: null,
        answer: null,
        isReady: false,
        isCorrect: false,
        shield: prev.shield // Maintain shield from previous round
      }));
      setOpponentState(prev => ({
        ...prev,
        selectedAction: null,
        answer: null,
        isReady: false,
        isCorrect: false,
        shield: prev.shield // Maintain shield from previous round
      }));
    } else {
      setPhase(BattlePhase.COMPLETED);
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
            {/* Health Bars */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
              {/* Player Health */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  You ({playerState.health} HP)
                  {playerState.shield > 0 && ` + ${playerState.shield} Shield`}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(playerState.health / 50) * 100}
                  sx={{
                    height: 10,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'primary.main'
                    }
                  }}
                />
              </Box>

              {/* VS */}
              <Typography variant="h6" color="text.secondary">
                VS
              </Typography>

              {/* Opponent Health */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Opponent ({opponentState.health} HP)
                  {opponentState.shield > 0 && ` + ${opponentState.shield} Shield`}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(opponentState.health / 50) * 100}
                  sx={{
                    height: 10,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'error.main'
                    }
                  }}
                />
              </Box>
            </Box>

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
                Initializing {selectedMode !== 'all' ? `${selectedMode} ` : ''}Battle...
              </Typography>
            </motion.div>
          )}

          {phase === BattlePhase.PREPARING && (
            <PreBattleLobby
              onBattleStart={handleBattleStart}
              onCancel={() => navigate(-1)}
              onModeSelect={setSelectedMode}
              selectedMode={selectedMode}
            />
          )}

          {phase === BattlePhase.READY && currentQuestion && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, p: 4 }}>
              {/* Battle Actions */}
              <BattleActions
                selectedAction={playerState.selectedAction}
                onSelectAction={handleSelectAction}
                isReady={playerState.isReady}
                onReady={handleReady}
                disabled={!selectedAnswer}
              />

              {/* Question Display */}
              <QuestionDisplay
                question={currentQuestion}
                on_answer={handleAnswer}
                selected_answer={selectedAnswer}
                is_correct={playerState.isCorrect}
                time_left={timeLeft}
                disabled={playerState.isReady}
              />
            </Box>
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