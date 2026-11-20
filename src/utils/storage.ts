function runStorageAction<Result>(
  action: () => Result,
  fallback: Result
): Result {
  try {
    return action();
  } catch {
    // Storage throws when the browser blocks it (private mode, disabled cookies): the site works without it.
    return fallback;
  }
}

export function readStoredValue(key: string): string | null {
  return runStorageAction(() => window.localStorage.getItem(key), null);
}

export function writeStoredValue(key: string, value: string) {
  runStorageAction(() => {
    window.localStorage.setItem(key, value);
  }, undefined);
}

export function removeStoredValue(key: string) {
  runStorageAction(() => {
    window.localStorage.removeItem(key);
  }, undefined);
}

export function readSessionValue(key: string): string | null {
  return runStorageAction(() => window.sessionStorage.getItem(key), null);
}

export function writeSessionValue(key: string, value: string): boolean {
  return runStorageAction(() => {
    window.sessionStorage.setItem(key, value);

    return true;
  }, false);
}
