import type { Language } from '@/i18n/languages';
import { captureError } from '@/utils/capture-error';

import bundledCopyJson from './band-copy/ru.json';
import { type BandCopyFile, bandCopyFileSchema } from './schemas';

const bundledLanguage = 'ru' satisfies Language;

type LazyLanguage = Exclude<Language, typeof bundledLanguage>;

const lazyCopyLoaders: Record<
  LazyLanguage,
  () => Promise<{ default: unknown }>
> = {
  en: () => import('./band-copy/en.json'),
  uk: () => import('./band-copy/uk.json'),
};

const bundledCopy = bandCopyFileSchema.parse(bundledCopyJson);
const loadedCopy = new Map<Language, BandCopyFile>([
  [bundledLanguage, bundledCopy],
]);
const pendingCopy = new Map<LazyLanguage, Promise<boolean>>();
const listeners = new Set<() => void>();

async function loadLazyCopy(language: LazyLanguage) {
  try {
    const { default: data } = await lazyCopyLoaders[language]();

    loadedCopy.set(language, bandCopyFileSchema.parse(data));
  } catch (error) {
    captureError(
      new Error(`Band copy for "${language}" failed to load.`, {
        cause: error,
      }),
      { source: 'content:band-copy' }
    );

    return false;
  } finally {
    pendingCopy.delete(language);
  }

  for (const listener of listeners) listener();

  return true;
}

export function preloadBandCopy(language: Language): Promise<boolean> {
  if (language === bundledLanguage || loadedCopy.has(language)) {
    return Promise.resolve(true);
  }

  const pending = pendingCopy.get(language) ?? loadLazyCopy(language);

  pendingCopy.set(language, pending);

  return pending;
}

export function subscribeToBandCopy(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getBandCopyVersion() {
  return loadedCopy.size;
}

export function getBandCopy(language: Language): BandCopyFile {
  return loadedCopy.get(language) ?? bundledCopy;
}
