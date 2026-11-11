import { useCallback, useEffect, useState } from 'react';

import { writeStoredValue } from '@/utils/storage';

import {
  applyTheme,
  darkSchemeQuery,
  readThemePreference,
  type ThemePreference,
  themeStorageKey,
} from '../utils/theme';

export function useTheme() {
  const [preference, setPreference] = useState(() =>
    readThemePreference(themeStorageKey)
  );

  useEffect(() => {
    const systemScheme = window.matchMedia(darkSchemeQuery);
    const handleSystemChange = () => {
      applyTheme(preference, systemScheme.matches);
    };

    handleSystemChange();
    systemScheme.addEventListener('change', handleSystemChange);

    return () => {
      systemScheme.removeEventListener('change', handleSystemChange);
    };
  }, [preference]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === themeStorageKey || event.key === null) {
        setPreference(readThemePreference(themeStorageKey));
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const changeTheme = useCallback((nextPreference: ThemePreference) => {
    setPreference(nextPreference);
    writeStoredValue(themeStorageKey, nextPreference);
  }, []);

  return { preference, changeTheme };
}
