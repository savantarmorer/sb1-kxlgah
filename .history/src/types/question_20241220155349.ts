export interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: string;
  difficulty: string;
  category?: string;
  explanation?: string;
} 