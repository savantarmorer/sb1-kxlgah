import React, { createContext, useContext, useState } from 'react';
import { translations, Languages } from '../i18n/translations';

type Language = Languages;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (!value[k]) return key;
      value = value[k];
    }

    if (params) {
      return Object.entries(params).reduce((str, [key, value]) => {
        return str.replace(new RegExp(`{${key}}`, 'g'), String(value));
      }, value as string);
    }

    return value as string;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export const useTranslation = useLanguage;