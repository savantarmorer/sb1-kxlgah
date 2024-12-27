export interface BattleQuestion {
  id: string;
  text?: string;
  question?: string;
  options?: string[];
  alternative_a: string;
  alternative_b: string;
  alternative_c: string;
  alternative_d: string;
  correct_answer: string;
  category?: string;
  subject_area?: string;
  difficulty: number;
  created_at?: string;
}

export type QuestionFormat = BattleQuestion; 