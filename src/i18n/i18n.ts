import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';

import { invariant } from '@/utils/invariant';
import { readStoredValue } from '@/utils/storage';

import {
  defaultLanguage,
  detectLanguage,
  isLanguage,
  type Language,
  languageStorageKey,
} from './languages';
import en from './locales/en.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';

const resources = {
  ru: { translation: ru },
  en: { translation: en },
  uk: { translation: uk },
} satisfies Record<Language, { translation: typeof ru }>;

declare module 'i18next' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- module augmentation needs an interface
  interface CustomTypeOptions {
    resources: typeof resources.ru;
  }
}

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(
    readStoredValue(languageStorageKey),
    window.navigator.languages
  ),
  fallbackLng: defaultLanguage,
  interpolation: { escapeValue: false },
  initAsync: false,
});

export function getResolvedLanguage(): Language {
  const { resolvedLanguage } = i18n;

  invariant(
    resolvedLanguage !== undefined && isLanguage(resolvedLanguage),
    'i18next resolved a language the site does not support.'
  );

  return resolvedLanguage;
}

export { i18n };
