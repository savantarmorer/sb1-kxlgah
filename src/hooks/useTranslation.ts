import { use_language } from '../contexts/LanguageContext';

export const useTranslation = (namespace?: string) => {
  const { t, language, setLanguage } = use_language();
  
  return {
    t: (key: string, params?: Record<string, any>) => 
      namespace ? t(`${namespace}.${key}`, params) : t(key, params),
    language,
    setLanguage
  };
}; 