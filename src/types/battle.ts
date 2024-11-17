export interface Question {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: number;
  category: 'constitutional' | 'civil' | 'criminal' | 'administrative';
  difficulty: 1 | 2 | 3;
  metadata?: {
    explanation?: string;
    source?: string;
    tags?: string[];
  };
}

export interface BattleState {
  status: 'searching' | 'ready' | 'battle' | 'completed';
  currentQuestion: number;
  timeLeft: number;
  score: {
    player: number;
    opponent: number;
  };
  streakBonus: number;
  questions: Question[];
}

export interface BattleResults {
  score: number;
  totalQuestions: number;
  xpEarned: number;
  coinsEarned: number;
  isVictory: boolean;
  streakBonus: number;
  achievements: string[];
} 