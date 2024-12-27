export interface BattleQuestion {
  id: string;
  question: string;
  alternative_a: string;
  alternative_b: string;
  alternative_c: string;
  alternative_d: string;
  correct_answer: string;
  category?: string;
  difficulty?: number;
  created_at?: string;
} 