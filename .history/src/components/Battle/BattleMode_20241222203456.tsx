import React, { useState, useCallback, useEffect } from 'react';
import { Box, Container, useTheme, alpha, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase';
import { 
  BattleQuestion, 
  BattlePhase,
  PlayerState,
  BattleAction,
  initialPlayerState,
  ACTION_ADVANTAGES,
  calculateDamage
} from '../../types/battle';
import { BATTLE_CONFIG } from '../../config/battleConfig';
import { BattleHeader } from './BattleHeader';
import { BattleArena } from './BattleArena';
import { BattleTimer } from './BattleTimer';
import { BattleFooter } from './BattleFooter';
import { PreBattleLobby } from './PreBattleLobby';
import { QuestionDisplay } from './QuestionDisplay';
import { BattleResults } from './BattleResults';
import { BattleActions } from './BattleActions';

type BattleMode = 'all' | 'constitutional' | 'criminal' | 'civil';

interface BattleModeProps {
  mode?: BattleMode;
}

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

  // Timer effect
  useEffect(() => {
    if (phase !== BattlePhase.READY || !currentQuestion || playerState.isReady) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
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

  const initializeBattle = useCallback(async () => {
    try {
      setPhase(BattlePhase.INITIALIZING);
      
      let query = supabase
        .from('battle_questions')
        .select('*')
        .limit(BATTLE_CONFIG.questions_per_battle);

      if (selectedMode !== 'all') {
        query = query.eq('category', selectedMode);
      }

      const { data: questions, error } = await query.order('id', { ascending: false });

      if (error) throw error;
      
      if (!questions || questions.length === 0) {
        throw new Error(`No questions available for ${selectedMode} mode`);
      }

      const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);

      setQuestions(shuffledQuestions);
      setCurrentQuestion(shuffledQuestions[0]);
      setCurrentQuestionIndex(0);
      setTimeLeft(BATTLE_CONFIG.time_per_question);
      setScore({ player: 0, opponent: 0 });
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setStreak(0);
      
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

  const handleReady = () => {
    if (!playerState.selectedAction || !selectedAnswer || !currentQuestion) return;

    setPlayerState(prev => ({
      ...prev,
      isReady: true,
      timeLeft
    }));

    setTimeout(() => {
      const botAction = Object.keys(ACTION_ADVANTAGES)[Math.floor(Math.random() * 3)] as BattleAction;
      const botTimeLeft = Math.floor(Math.random() * timeLeft);
      
      const botAccuracy = BATTLE_CONFIG.bot.base_accuracy + 
        (BATTLE_CONFIG.bot.accuracy_multiplier * (state.battleRatings?.rating || BATTLE_CONFIG.matchmaking.default_rating) / 1000);
      const botCorrect = Math.random() < botAccuracy;
      
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

      setShowAnswerReveal(true);
      
      setTimeout(() => {
        setShowAnswerReveal(false);
        setShowBattleAnimation(true);
        processBattleRound();
      }, 2000);
    }, 1000);
  };

  const processBattleRound = async () => {
    if (!playerState.selectedAction || !opponentState.selectedAction) return;

    const playerAdvantage = ACTION_ADVANTAGES[playerState.selectedAction] === opponentState.selectedAction;
    const opponentAdvantage = ACTION_ADVANTAGES[opponentState.selectedAction] === playerState.selectedAction;

    let newPlayerState = { ...playerState };
    let newOpponentState = { ...opponentState };

    if (playerAdvantage && playerState.isCorrect) {
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
    } else if (opponentAdvantage && opponentState.isCorrect) {
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
      if (!playerState.isCorrect && !opponentState.isCorrect) {
        const damage = 10;
        newPlayerState.health -= damage;
        newOpponentState.health -= damage;
        setBattleResult({
          attacker: 'player',
          damage
        });
      }
    }

    setTimeout(() => {
      setPlayerState(newPlayerState);
      setOpponentState(newOpponentState);
      setShowBattleAnimation(false);
      setBattleResult(null);

      if (newPlayerState.health <= 0 || newOpponentState.health <= 0) {
        setPhase(BattlePhase.COMPLETED);
        if (newOpponentState.health <= 0) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
        return;
      }

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
          shield: prev.shield
        }));
        setOpponentState(prev => ({
          ...prev,
          selectedAction: null,
          answer: null,
          isReady: false,
          isCorrect: false,
          shield: prev.shield
        }));
        setPhase(BattlePhase.READY);
      } else {
        setPhase(BattlePhase.COMPLETED);
      }
    }, 2000);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <BattleHeader />

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
              <BattleTimer timeLeft={timeLeft} isActive={!playerState.isReady} />
              
              <BattleArena
                playerState={playerState}
                opponentState={opponentState}
                currentUser={state.user}
                botAvatar={botAvatar}
              />

              <BattleActions
                selectedAction={playerState.selectedAction}
                onSelectAction={handleSelectAction}
                isReady={playerState.isReady}
                onReady={handleReady}
                disabled={!selectedAnswer}
              />

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
      </Box>

      <BattleFooter
        battleStats={{
          wins: state.battleStats?.wins || 0,
          rating: state.battleRatings?.rating || BATTLE_CONFIG.matchmaking.default_rating
        }}
        phase={phase}
      />

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