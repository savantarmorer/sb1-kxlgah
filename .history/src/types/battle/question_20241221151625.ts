export interface Question {
  id: string;
  text?: string;
  question?: string;
  options?: string[];
  alternative_a?: string;
  alternative_b?: string;
  alternative_c?: string;
  alternative_d?: string;
  correct_answer: string;
  category?: string;
  subject_area?: string;
  difficulty: number;
  created_at?: string;
}

export interface BattleQuestion extends Question {
  text: string;
  question: string;
  alternative_a: string;
  alternative_b: string;
  alternative_c: string;
  alternative_d: string;
  options: string[];
  category: string;
  subject_area: string;
}

export type QuestionFormat = Question; 