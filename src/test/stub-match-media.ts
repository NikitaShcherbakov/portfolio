import { act } from '@testing-library/react';
import { vi } from 'vitest';

export function stubMatchMedia(isSystemDark = false) {
  const listeners = new Set<() => void>();
  const mediaQueryList = {
    matches: isSystemDark,
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener);
    },
  };

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mediaQueryList)
  );

  return {
    setSystemDark(isDark: boolean) {
      act(() => {
        mediaQueryList.matches = isDark;
        listeners.forEach((listener) => {
          listener();
        });
      });
    },
  };
}
