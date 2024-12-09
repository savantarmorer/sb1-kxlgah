import { useCallback } from 'react';

const translations = {
  en: {
    tournament: {
      rounds: {
        quarter_finals: 'Quarter Finals',
        semi_finals: 'Semi Finals',
        finals: 'Finals'
      },
      status: {
        upcoming: 'Upcoming',
        registration: 'Registration Open',
        in_progress: 'In Progress',
        completed: 'Completed',
        cancelled: 'Cancelled'
      },
      register: 'Register',
      start_match: 'Start Match',
      match: {
        correct_answer: 'Correct!',
        wrong_answer: 'Wrong!',
        score: 'Score',
        question: 'Question'
      }
    },
    error: {
      loading_question: 'Error loading question'
    }
  }
};

type TranslationKey = string;

export function useLanguage(locale: string = 'en') {
  const t = useCallback((key: TranslationKey) => {
    const keys = key.split('.');
    let value: any = translations[locale as keyof typeof translations];
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }
    
    return value as string;
  }, [locale]);

  return { t };
} 