import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

import { defaultLanguage, i18n } from '@/i18n';

import { stubMatchMedia } from './stub-match-media';

import '@testing-library/jest-dom/vitest';

beforeEach(async () => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  stubMatchMedia();
  await i18n.changeLanguage(defaultLanguage);
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('style');
});
