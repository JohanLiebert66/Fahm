import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ar from './ar.json';

export type Language = 'en' | 'ar';

export const LANGUAGE_STORAGE_KEY = 'fahm_language';

export function getInitialLanguage(): Language {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') {
        return saved;
      }
    } catch {
      // Local storage unavailable
    }

    if (typeof navigator !== 'undefined' && navigator.language) {
      if (navigator.language.toLowerCase().startsWith('ar')) {
        return 'ar';
      }
    }
  }

  return 'en';
}

export function setDocumentLanguage(lang: Language): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

export function changeLanguage(lang: Language): Promise<unknown> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Local storage unavailable
    }
  }
  setDocumentLanguage(lang);
  return i18n.changeLanguage(lang);
}

const initialLang = getInitialLanguage();
setDocumentLanguage(initialLang);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (lng: string) => {
  const normalized: Language = lng.startsWith('ar') ? 'ar' : 'en';
  setDocumentLanguage(normalized);
});

export default i18n;
