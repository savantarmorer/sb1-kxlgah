import { Achievement } from './achievements';

export interface Question {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: number;
}

export interface BattleResults {
  score: number;
  totalQuestions: number;
  xpEarned: number;
  coinsEarned: number;
  isVictory: boolean;
  streakBonus: number;
  achievements: Achievement[];
} 