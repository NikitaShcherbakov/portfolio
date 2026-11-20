import { useEffect, useState } from 'react';

export function useDelayedFlag(value: boolean, delayMs: number) {
  const [hasLasted, setHasLasted] = useState(false);

  useEffect(() => {
    if (!value) return;

    const timeoutId = window.setTimeout(() => {
      setHasLasted(true);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
      setHasLasted(false);
    };
  }, [value, delayMs]);

  return value && hasLasted;
}
