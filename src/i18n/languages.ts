export const languageNames = {
  ru: 'Русский',
  en: 'English',
  uk: 'Українська',
} as const;

export type Language = keyof typeof languageNames;

export const defaultLanguage: Language = 'ru';

export const languageStorageKey = 'language';

export const languages = Object.keys(languageNames) as Language[];

export function isLanguage(value: string): value is Language {
  return Object.hasOwn(languageNames, value);
}

export function detectLanguage(
  storedLanguage: string | null,
  browserLanguages: readonly string[]
): Language {
  if (storedLanguage !== null && isLanguage(storedLanguage)) {
    return storedLanguage;
  }

  for (const browserLanguage of browserLanguages) {
    const baseLanguage = browserLanguage.toLowerCase().split('-')[0] ?? '';

    if (isLanguage(baseLanguage)) {
      return baseLanguage;
    }
  }

  return defaultLanguage;
}
