import { useCallback, useEffect, useRef, useState } from 'react';

export function useTransientFlag(durationMs: number) {
  const [isActive, setIsActive] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
    },
    []
  );

  const activate = useCallback(() => {
    window.clearTimeout(timeoutRef.current);
    setIsActive(true);
    timeoutRef.current = window.setTimeout(() => {
      setIsActive(false);
    }, durationMs);
  }, [durationMs]);

  return [isActive, activate] as const;
}
