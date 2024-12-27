import { Box } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../../hooks/useGameState';
import { BattlePhase, BattleAction, PlayerState, BattleQuestion } from '../../types/battle';
import { BATTLE_CONFIG } from '../../config/battle';
import { ACTION_ADVANTAGES } from '../../utils/battle';
import BattleHeader from './BattleHeader';
import BattleActions from './BattleActions';
import BattleAnimation from './BattleAnimation';
import AnswerReveal from './AnswerReveal';
import BattleResults from './BattleResults';
import QuestionDisplay from '../Question/QuestionDisplay';

interface BattleModeProps {
  mode?: 'all' | 'constitutional' | 'criminal' | 'civil';
}

const initialPlayerState: PlayerState = {
  health: 50,
  shield: 0,
  selectedAction: null,
  answer: null,
  isReady: false,
  isCorrect: false,
  timeLeft: BATTLE_CONFIG.time_per_question
};

export default function BattleMode({ mode = 'all' }: BattleModeProps) {
  const navigate = useNavigate();
  const { state } = useGameState();
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

    // Simulate opponent's answer using battle_ratings
    const opponentAccuracy = BATTLE_CONFIG.bot.base_accuracy + 
      (BATTLE_CONFIG.bot.accuracy_multiplier * (state.battle_ratings?.rating || BATTLE_CONFIG.matchmaking.default_rating) / 1000);
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
              {/* Players Info and Health Bars */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 4
              }}>
                {/* Player Info */}
                <Box sx={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <Avatar
                    src={state.user?.avatar_url}
                    sx={{ 
                      width: 80,
                      height: 80,
                      border: '4px solid',
                      borderColor: 'primary.main'
                    }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {state.user?.name}
                  </Typography>
                  {/* Player Health/Shield */}
                  <Box sx={{ width: '100%', maxWidth: 200 }}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        HP: {playerState.health}/50
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(playerState.health / 50) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: 'primary.main'
                          }
                        }}
                      />
                    </Box>
                    {playerState.shield > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Shield: {playerState.shield}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(playerState.shield / 30) * 100}
                          sx={{
                            height: 6,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              bgcolor: 'info.main'
                            }
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Timer */}
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  mx: 4
                }}>
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    border: '2px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.2)
                  }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {timeLeft}
                    </Typography>
                  </Box>
                  <Typography variant="h6" color="text.secondary">
                    VS
                  </Typography>
                </Box>

                {/* Opponent Info */}
                <Box sx={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <Avatar
                    src={botAvatar}
                    sx={{ 
                      width: 80,
                      height: 80,
                      border: '4px solid',
                      borderColor: 'error.main'
                    }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Bot Opponent
                  </Typography>
                  {/* Opponent Health/Shield */}
                  <Box sx={{ width: '100%', maxWidth: 200 }}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        HP: {opponentState.health}/50
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(opponentState.health / 50) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: 'error.main'
                          }
                        }}
                      />
                    </Box>
                    {opponentState.shield > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Shield: {opponentState.shield}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(opponentState.shield / 30) * 100}
                          sx={{
                            height: 6,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              bgcolor: 'info.main'
                            }
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Instructions */}
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                mb: 2
              }}>
                {!selectedAnswer && (
                  <Typography 
                    variant="h6" 
                    color="text.secondary"
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      ↓
                    </motion.div>
                    Select your answer first
                  </Typography>
                )}
                {selectedAnswer && !playerState.selectedAction && (
                  <Typography 
                    variant="h6" 
                    color="text.secondary"
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      ↑
                    </motion.div>
                    Now choose your action
                  </Typography>
                )}
                {selectedAnswer && playerState.selectedAction && !playerState.isReady && (
                  <Typography 
                    variant="h6" 
                    color="text.secondary"
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      →
                    </motion.div>
                    Press Ready to confirm
                  </Typography>
                )}
              </Box>

              {/* Battle Actions with Visual Guide */}
              <Box sx={{ 
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                {/* Action Selection Circle */}
                <BattleActions
                  selectedAction={playerState.selectedAction}
                  onSelectAction={handleSelectAction}
                  isReady={playerState.isReady}
                  onReady={handleReady}
                  disabled={!selectedAnswer}
                />

                {/* Bot's Selected Action */}
                {opponentState.selectedAction && (
                  <Box sx={{ 
                    position: 'absolute',
                    top: -60,
                    right: '10%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 1,
                    px: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    border: '1px solid',
                    borderColor: 'error.main'
                  }}>
                    <Typography variant="body2" color="error.main">
                      Bot selected: {ACTION_LABELS[opponentState.selectedAction]}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Question Display */}
              <QuestionDisplay
                question={currentQuestion}
                on_answer={handleAnswer}
                selected_answer={selectedAnswer}
                is_correct={playerState.isCorrect}
                time_left={timeLeft}
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

        {/* Answer Reveal Animation */}
        <AnimatePresence>
          {showAnswerReveal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(theme.palette.background.paper, 0.9),
                zIndex: 10
              }}
            >
              <Box sx={{ 
                display: 'flex',
                gap: 4,
                alignItems: 'center'
              }}>
                {/* Player Answer */}
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Box sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    border: '2px solid',
                    borderColor: playerState.isCorrect ? 'success.main' : 'error.main'
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {selectedAnswer}
                    </Typography>
                  </Box>
                </motion.div>

                <Typography variant="h6" color="text.secondary">
                  VS
                </Typography>

                {/* Bot Answer */}
                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Box sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    border: '2px solid',
                    borderColor: opponentState.isCorrect ? 'success.main' : 'error.main'
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {opponentState.answer}
                    </Typography>
                  </Box>
                </motion.div>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Battle Animation */}
        <AnimatePresence>
          {showBattleAnimation && battleResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(theme.palette.background.paper, 0.9),
                zIndex: 10
              }}
            >
              <Box sx={{ 
                display: 'flex',
                gap: 8,
                alignItems: 'center'
              }}>
                {/* Attacker */}
                <motion.div
                  animate={battleResult.attacker === 'player' ? { x: [0, 200, 0] } : { x: 0 }}
                  transition={{ duration: 1 }}
                >
                  <Avatar
                    src={battleResult.attacker === 'player' ? state.user?.avatar_url : botAvatar}
                    sx={{ 
                      width: 100,
                      height: 100,
                      border: '4px solid',
                      borderColor: battleResult.attacker === 'player' ? 'primary.main' : 'error.main'
                    }}
                  />
                </motion.div>

                {/* Battle Effects */}
                <Box sx={{ position: 'relative' }}>
                  {battleResult.shieldBlock && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          color: 'info.main',
                          fontWeight: 'bold',
                          textShadow: '0 0 10px currentColor'
                        }}
                      >
                        Shield Block: {battleResult.shieldBlock}
                      </Typography>
                    </motion.div>
                  )}
                  
                  {battleResult.shieldBreak && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          color: 'warning.main',
                          fontWeight: 'bold',
                          textShadow: '0 0 10px currentColor'
                        }}
                      >
                        Shield Break!
                      </Typography>
                    </motion.div>
                  )}

                  {battleResult.damage > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 1.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1 }}
                    >
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          color: 'error.main',
                          fontWeight: 'bold',
                          textShadow: '0 0 10px currentColor'
                        }}
                      >
                        -{battleResult.damage} HP
                      </Typography>
                    </motion.div>
                  )}
                </Box>

                {/* Defender */}
                <motion.div
                  animate={battleResult.attacker === 'opponent' ? { x: [0, -200, 0] } : { x: 0 }}
                  transition={{ duration: 1 }}
                >
                  <Avatar
                    src={battleResult.attacker === 'opponent' ? state.user?.avatar_url : botAvatar}
                    sx={{ 
                      width: 100,
                      height: 100,
                      border: '4px solid',
                      borderColor: battleResult.attacker === 'opponent' ? 'primary.main' : 'error.main'
                    }}
                  />
                </motion.div>
              </Box>
            </motion.div>
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
              Rating: <span className="font-bold">{state.battle_ratings?.rating || BATTLE_CONFIG.matchmaking.default_rating}</span>
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