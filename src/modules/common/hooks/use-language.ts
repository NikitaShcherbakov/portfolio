import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

import {
  getBandCopyVersion,
  preloadBandCopy,
  subscribeToBandCopy,
} from '@/content/band-copy';
import {
  getResolvedLanguage,
  i18n,
  isLanguage,
  type Language,
  languageStorageKey,
} from '@/i18n';
import { invariant } from '@/utils/invariant';
import { writeStoredValue } from '@/utils/storage';

let requestedLanguage: Language | null = null;

async function switchLanguage(language: Language) {
  requestedLanguage = language;

  const isLoaded = await preloadBandCopy(language);

  if (!isLoaded || requestedLanguage !== language) return false;

  await i18n.changeLanguage(language);

  return true;
}

export function useCurrentLanguage(): Language {
  useTranslation();
  useSyncExternalStore(subscribeToBandCopy, getBandCopyVersion);

  return getResolvedLanguage();
}

export function useLanguage() {
  const language = useCurrentLanguage();

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === languageStorageKey &&
        event.newValue !== null &&
        isLanguage(event.newValue)
      ) {
        void switchLanguage(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const changeLanguage = useCallback(async (value: string) => {
    invariant(isLanguage(value), `Unsupported language "${value}".`);

    if (await switchLanguage(value)) {
      writeStoredValue(languageStorageKey, value);
    }
  }, []);

  return { language, changeLanguage };
}
