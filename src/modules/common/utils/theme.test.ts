import { describe, expect, it, vi } from 'vitest';

import { readThemePreference } from './theme';

describe('readThemePreference', () => {
  it('returns a stored light or dark theme', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'dark' });

    expect(readThemePreference('theme')).toBe('dark');
  });

  it('falls back to the system theme for anything else', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'purple' });

    expect(readThemePreference('theme')).toBe('system');
  });

  it('falls back to the system theme when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError');
      },
    });

    expect(readThemePreference('theme')).toBe('system');
  });
});
