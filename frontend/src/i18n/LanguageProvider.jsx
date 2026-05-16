import { createContext, useEffect, useMemo, useState } from 'react';

import { translations } from './translations';

export const LanguageContext = createContext(null);

const DEFAULT_LANGUAGE = 'ru';
const STORAGE_KEY = 'tfr_language';

function getInitialLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved && translations[saved]) {
    return saved;
  }

  return DEFAULT_LANGUAGE;
}

function getNestedValue(object, path) {
  return path.split('.').reduce((acc, key) => {
    if (!acc) return undefined;
    return acc[key];
  }, object);
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo(() => {
    function t(key) {
      return (
        getNestedValue(translations[language], key) ||
        getNestedValue(translations.en, key) ||
        key
      );
    }

    return {
      language,
      setLanguage,
      t
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
