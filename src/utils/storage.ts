export function readStoredValue(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Storage throws when the browser blocks it (private mode, disabled cookies): fall back to defaults.
    return null;
  }
}

export function writeStoredValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage throws when the browser blocks it: the choice then lasts only for this visit.
  }
}
