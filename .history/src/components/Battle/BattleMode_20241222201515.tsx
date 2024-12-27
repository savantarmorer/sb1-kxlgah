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
  Grid,
  Paper
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

const ACTION_LABELS: Record<BattleAction, string> = {
  'inicial': 'Inicial',
  'contestacao': 'Contestação',
  'reconvencao': 'Reconvenção'
};

export default function BattleMode({ mode = 'all' }: BattleModeProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state } = useGame();
  const { showError } = useNotification();
  
  const [botAvatar, setBotAvatar] = useState<string>('/images/avatars/bot.png');
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
  const [showAnswerReveal, setShowAnswerReveal] = useState(false);
  const [showBattleAnimation, setShowBattleAnimation] = useState(false);
  const [battleResult, setBattleResult] = useState<{
    attacker: 'player' | 'opponent';
    damage: number;
    shieldBlock?: number;
    shieldBreak?: number;
  } | null>(null);

  // Fetch bot avatar on mount
  useEffect(() => {
    const fetchBotAvatar = async () => {
      try {
        const { data: avatars, error } = await supabase
          .from('avatars')
          .select('url')
          .eq('category', 'bot')
          .limit(1)
          .single();

        if (error) throw error;
        if (avatars?.url) {
          setBotAvatar(avatars.url);
        }
      } catch (error) {
        console.error('Error fetching bot avatar:', error);
        // Keep default avatar if fetch fails
      }
    };

    fetchBotAvatar();
  }, []);

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
          // Auto-submit empty answer and random action when time runs out
          if (!playerState.selectedAction) {
            const randomAction = Object.keys(ACTION_ADVANTAGES)[Math.floor(Math.random() * 3)] as BattleAction;
            setPlayerState(prev => ({
              ...prev,
              selectedAction: randomAction,
              isReady: true,
              timeLeft: 0
            }));
          }
          handleAnswer('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, currentQuestion, playerState.isReady, playerState.selectedAction]);

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
    if (!playerState.selectedAction || !selectedAnswer || !currentQuestion) return;

    setPlayerState(prev => ({
      ...prev,
      isReady: true,
      timeLeft: timeLeft
    }));

    // Simulate bot's turn with a slight delay
    setTimeout(() => {
      // Bot selects action
      const botAction = Object.keys(ACTION_ADVANTAGES)[Math.floor(Math.random() * 3)] as BattleAction;
      const botTimeLeft = Math.floor(Math.random() * timeLeft);
      
      // Bot selects answer
      const botAccuracy = BATTLE_CONFIG.bot.base_accuracy + 
        (BATTLE_CONFIG.bot.accuracy_multiplier * (state.battle_ratings?.rating || BATTLE_CONFIG.matchmaking.default_rating) / 1000);
      const botCorrect = Math.random() < botAccuracy;
      
      // Ensure we have a valid answer
      let botAnswer: string;
      if (botCorrect) {
        botAnswer = currentQuestion.correct_answer;
      } else {
        const incorrectAnswers = ['A', 'B', 'C', 'D'].filter(a => a !== currentQuestion.correct_answer);
        botAnswer = incorrectAnswers[Math.floor(Math.random() * incorrectAnswers.length)];
      }
      
      setOpponentState(prev => ({
        ...prev,
        selectedAction: botAction,
        answer: botAnswer,
        isReady: true,
        timeLeft: botTimeLeft,
        isCorrect: botCorrect
      }));

      // Show answer reveal animation
      setShowAnswerReveal(true);
      
      // Process battle round after animations
      setTimeout(() => {
        setShowAnswerReveal(false);
        setShowBattleAnimation(true);
        processBattleRound();
      }, 3000); // Wait for answer reveal animation
    }, 1000);
  };

  const calculateDamage = (attacker: PlayerState, defender: PlayerState): number => {
    if (!attacker.isCorrect) return 0;
    const baseDamage = Math.ceil((attacker.timeLeft / BATTLE_CONFIG.time_per_question) * 20);
    return baseDamage;
  };

  const handleAnswer = async (answer: string) => {
    if (!currentQuestion || playerState.isReady) return;

    setSelectedAnswer(answer);
    const isCorrect = answer.toUpperCase() === currentQuestion.correct_answer.toUpperCase();
    
    setPlayerState(prev => ({
      ...prev,
      answer,
      isCorrect
    }));
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
      const shieldBlock = Math.min(opponentState.shield, damage);
      const actualDamage = Math.max(0, damage - shieldBlock);
      
      setBattleResult({
        attacker: 'player',
        damage: actualDamage,
        shieldBlock,
        shieldBreak: shieldBlock === opponentState.shield ? shieldBlock : 0
      });

      newOpponentState.health -= actualDamage;
      newOpponentState.shield = Math.max(0, opponentState.shield - damage);
    } else if (opponentAdvantage) {
      // Opponent attacks
      const damage = calculateDamage(opponentState, playerState);
      const shieldBlock = Math.min(playerState.shield, damage);
      const actualDamage = Math.max(0, damage - shieldBlock);
      
      setBattleResult({
        attacker: 'opponent',
        damage: actualDamage,
        shieldBlock,
        shieldBreak: shieldBlock === playerState.shield ? shieldBlock : 0
      });

      newPlayerState.health -= actualDamage;
      newPlayerState.shield = Math.max(0, playerState.shield - damage);
    } else {
      // Both players failed or tied
      if (!playerState.isCorrect && !opponentState.isCorrect) {
        newPlayerState.health -= 10;
        newOpponentState.health -= 10;
        setBattleResult({
          attacker: 'player',
          damage: 10
        });
      } else if (playerState.isCorrect && opponentState.isCorrect) {
        // Both correct - defender gets shield
        if (playerAdvantage) {
          newOpponentState.shield += opponentState.timeLeft;
        } else if (opponentAdvantage) {
          newPlayerState.shield += playerState.timeLeft;
        }
      }
    }

    // Update states after animation
    setTimeout(() => {
      setPlayerState(newPlayerState);
      setOpponentState(newOpponentState);
      setShowBattleAnimation(false);
      setBattleResult(null);

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
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentQuestion(questions[currentQuestionIndex + 1]);
        setTimeLeft(BATTLE_CONFIG.time_per_question);
        setSelectedAnswer(null);
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
        setPhase(BattlePhase.READY);
      } else {
        setPhase(BattlePhase.COMPLETED);
      }
    }, 2000); // Wait for battle animation
  };

  return (
    <Box sx={{ height: '100vh', bgcolor: 'background.default', color: 'text.primary', p: 2 }}>
      {/* Battle header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        {/* Player info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={state.user?.avatar_url} sx={{ width: 64, height: 64, border: '2px solid', borderColor: 'primary.main' }} />
          <Box>
            <Typography variant="h6">{state.user?.username || 'Player'}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={(playerState.health / 50) * 100}
                  sx={{
                  width: 150, 
                    height: 10,
                  borderRadius: 5,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                    backgroundColor: 'primary.main'
                    }
                  }}
                />
              <Typography variant="body2">{playerState.health}/50</Typography>
              </Box>
            {playerState.shield > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={(playerState.shield / 50) * 100} 
                  sx={{
                    width: 150, 
                    height: 6, 
                    borderRadius: 5,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'info.main'
                    }
                  }}
                />
                <Typography variant="body2" color="info.main">{playerState.shield}</Typography>
              </Box>
            )}
                  </Box>
                </Box>

                {/* Timer */}
                <Box sx={{ 
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
          border: '4px solid', 
          borderColor: timeLeft < 10 ? 'error.main' : 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="h4">{timeLeft}</Typography>
                </Box>

        {/* Opponent info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: 'row-reverse' }}>
          <Avatar src={botAvatar} sx={{ width: 64, height: 64, border: '2px solid', borderColor: 'error.main' }} />
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6">Bot Opponent</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: 'row-reverse' }}>
                      <LinearProgress
                        variant="determinate"
                        value={(opponentState.health / 50) * 100}
                        sx={{
                  width: 150, 
                  height: 10, 
                  borderRadius: 5,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                          '& .MuiLinearProgress-bar': {
                    backgroundColor: 'error.main'
                          }
                        }}
                      />
              <Typography variant="body2">{opponentState.health}/50</Typography>
                    </Box>
                    {opponentState.shield > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexDirection: 'row-reverse' }}>
                        <LinearProgress
                          variant="determinate"
                  value={(opponentState.shield / 50) * 100} 
                          sx={{
                    width: 150, 
                            height: 6,
                    borderRadius: 5,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': {
                      backgroundColor: 'info.main'
                            }
                          }}
                        />
                <Typography variant="body2" color="info.main">{opponentState.shield}</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

      {/* Battle actions */}
                <BattleActions
                  selectedAction={playerState.selectedAction}
        onSelectAction={(action) => setPlayerState(prev => ({ ...prev, selectedAction: action }))}
                  isReady={playerState.isReady}
                  onReady={handleReady}
        disabled={!selectedAnswer || playerState.isReady}
                />

      {/* Answer reveal animation */}
      {showAnswerReveal && currentQuestion && (
                  <Box sx={{ 
                    position: 'absolute',
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          width: '80%',
          bgcolor: 'background.paper',
                    borderRadius: 2,
          p: 4,
          textAlign: 'center'
        }}>
          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={6}>
              <Typography variant="h6" color="primary.main">Your Answer</Typography>
              <Paper sx={{ 
                p: 2, 
                bgcolor: playerState.isCorrect ? 'success.dark' : 'error.dark',
                color: 'white'
              }}>
                {playerState.answer || '-'}
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" color="error.main">Opponent's Answer</Typography>
              <Paper sx={{ 
                p: 2, 
                bgcolor: opponentState.isCorrect ? 'success.dark' : 'error.dark',
                color: 'white'
              }}>
                {opponentState.answer || '-'}
              </Paper>
            </Grid>
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" color="success.main">Correct Answer</Typography>
              <Paper sx={{ p: 2, bgcolor: 'success.dark', color: 'white' }}>
                {currentQuestion.correct_answer}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Battle animation */}
      {showBattleAnimation && battleResult && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <motion.div
            initial={{ x: battleResult.attacker === 'player' ? -300 : 300 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h4" sx={{ 
              color: battleResult.attacker === 'player' ? 'primary.main' : 'error.main',
              textShadow: '0 0 10px currentColor'
            }}>
              {battleResult.damage > 0 ? `${battleResult.damage} Damage!` : 'No damage'}
            </Typography>
            {battleResult.shieldBlock > 0 && (
              <Typography variant="h5" color="info.main">
                Shield blocked {battleResult.shieldBlock}!
              </Typography>
            )}
            {battleResult.shieldBreak > 0 && (
              <Typography variant="h5" color="warning.main">
                Shield broken! (-{battleResult.shieldBreak})
            </Typography>
            )}
          </motion.div>
        </Box>
      )}

      {/* Question display */}
      {currentQuestion && !showAnswerReveal && !showBattleAnimation && (
        <QuestionDisplay
          question={currentQuestion}
          onAnswer={handleAnswer}
          selectedAnswer={selectedAnswer}
          disabled={playerState.isReady}
        />
      )}

      {/* Battle completed */}
      {phase === BattlePhase.COMPLETED && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <Typography variant="h3" color={playerState.health > 0 ? 'success.main' : 'error.main'}>
            {playerState.health > 0 ? 'Victory!' : 'Defeat'}
          </Typography>
          <Button
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/battle')} 
            sx={{ mt: 2 }}
          >
            Return to Battle Menu
          </Button>
        </Box>
      )}

      {showConfetti && <Confetti />}
      </Box>
  );
}