export const themePreferences = {
  Light: 'light',
  Dark: 'dark',
  System: 'system',
} as const;

export type ThemePreference =
  (typeof themePreferences)[keyof typeof themePreferences];

type Theme = Exclude<ThemePreference, 'system'>;

export const themeStorageKey = 'theme';

export const darkSchemeQuery = '(prefers-color-scheme: dark)';

// readThemePreference and applyTheme are inlined into index.html via toString(),
// so they must not reference anything outside their own bodies.
export function readThemePreference(storageKey: string): ThemePreference {
  let storedValue: string | null = null;

  try {
    storedValue = localStorage.getItem(storageKey);
  } catch {
    // Storage throws when the browser blocks it: the system theme applies.
  }

  return storedValue === 'light' || storedValue === 'dark'
    ? storedValue
    : 'system';
}

export function applyTheme(preference: ThemePreference, isSystemDark: boolean) {
  let theme: Theme = isSystemDark ? 'dark' : 'light';

  if (preference !== 'system') {
    theme = preference;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function createThemeScript() {
  return `(${applyTheme.toString()})((${readThemePreference.toString()})(${JSON.stringify(themeStorageKey)}), window.matchMedia(${JSON.stringify(darkSchemeQuery)}).matches);`;
}
