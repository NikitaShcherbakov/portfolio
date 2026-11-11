import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import {
  defaultLanguage,
  isLanguage,
  type Language,
  languageStorageKey,
} from '@/i18n';
import { writeStoredValue } from '@/utils/storage';

export function useLanguage() {
  const { i18n } = useTranslation();
  const { resolvedLanguage } = i18n;
  const language: Language =
    resolvedLanguage !== undefined && isLanguage(resolvedLanguage)
      ? resolvedLanguage
      : defaultLanguage;

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === languageStorageKey &&
        event.newValue !== null &&
        isLanguage(event.newValue)
      ) {
        void i18n.changeLanguage(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [i18n]);

  const changeLanguage = useCallback(
    async (value: string) => {
      if (!isLanguage(value)) {
        throw new Error(`Unsupported language "${value}".`);
      }

      writeStoredValue(languageStorageKey, value);
      await i18n.changeLanguage(value);
    },
    [i18n]
  );

  return { language, changeLanguage };
}
