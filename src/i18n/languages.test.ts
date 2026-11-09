import { describe, expect, it } from 'vitest';

import { detectLanguage, isLanguage } from './languages';

describe('detectLanguage', () => {
  it('prefers the stored language', () => {
    expect(detectLanguage('uk', ['en-US'])).toBe('uk');
  });

  it('ignores an unsupported stored value', () => {
    expect(detectLanguage('de', ['en-US'])).toBe('en');
  });

  it('takes the first supported browser language', () => {
    expect(detectLanguage(null, ['de-DE', 'uk-UA', 'en'])).toBe('uk');
  });

  it('falls back to Russian', () => {
    expect(detectLanguage(null, ['de-DE', 'fr'])).toBe('ru');
    expect(detectLanguage(null, [])).toBe('ru');
  });
});

describe('isLanguage', () => {
  it('accepts only supported languages', () => {
    expect(isLanguage('en')).toBe(true);
    expect(isLanguage('toString')).toBe(false);
  });
});
