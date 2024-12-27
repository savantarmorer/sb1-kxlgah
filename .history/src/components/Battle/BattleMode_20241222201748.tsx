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
  const [phase, setPhase] = useState<BattlePhase>(BattlePhase.READY);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<BattleQuestion | null>(null);
  const [timeLeft, setTimeLeft] = useState(BATTLE_CONFIG.time_per_question);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>(initialPlayerState);
  const [opponentState, setOpponentState] = useState<PlayerState>(initialPlayerState);
  const [showAnswerReveal, setShowAnswerReveal] = useState(false);
  const [showBattleAnimation, setShowBattleAnimation] = useState(false);
  const [battleResult, setBattleResult] = useState<{
    attacker: 'player' | 'opponent';
    damage: number;
    shieldBlock?: number;
    shieldBreak?: number;
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [botAvatar, setBotAvatar] = useState<string>('');

  useEffect(() => {
    // Fetch bot avatar
    const fetchBotAvatar = async () => {
      // Add your logic to fetch bot avatar
      setBotAvatar('/bot-avatar.png'); // Default avatar
    };
    fetchBotAvatar();
  }, []);

  useEffect(() => {
    // Fetch questions based on mode
    const fetchQuestions = async () => {
      // Add your logic to fetch questions
      setQuestions([]);
      setCurrentQuestion(null);
    };
    fetchQuestions();
  }, [mode]);

  useEffect(() => {
    if (phase !== BattlePhase.READY) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          handleAnswer('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

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
      }, 3000);
    }, 1000);
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
    }, 2000);
  };

  const calculateDamage = (attacker: PlayerState, defender: PlayerState) => {
    if (!attacker.isCorrect) return 0;
    return Math.max(10, attacker.timeLeft);
  };

  return (
    <Box sx={{ height: '100vh', bgcolor: 'background.default', color: 'text.primary', p: 2 }}>
      <BattleHeader
        playerState={playerState}
        opponentState={opponentState}
        user={state.user}
        botAvatar={botAvatar}
        timeLeft={timeLeft}
      />

      <BattleActions
        selectedAction={playerState.selectedAction}
        onSelectAction={(action) => setPlayerState(prev => ({ ...prev, selectedAction: action }))}
        isReady={playerState.isReady}
        onReady={handleReady}
        disabled={!selectedAnswer || playerState.isReady}
      />

      {showAnswerReveal && currentQuestion && (
        <AnswerReveal
          playerAnswer={playerState.answer}
          opponentAnswer={opponentState.answer}
          question={currentQuestion}
          playerIsCorrect={playerState.isCorrect}
          opponentIsCorrect={opponentState.isCorrect}
        />
      )}

      {showBattleAnimation && battleResult && (
        <BattleAnimation result={battleResult} />
      )}

      {currentQuestion && !showAnswerReveal && !showBattleAnimation && (
        <QuestionDisplay
          question={currentQuestion}
          onAnswer={handleAnswer}
          selectedAnswer={selectedAnswer}
          disabled={playerState.isReady}
        />
      )}

      {phase === BattlePhase.COMPLETED && (
        <BattleResults
          isVictory={playerState.health > 0}
          showConfetti={showConfetti}
        />
      )}
    </Box>
  );
}