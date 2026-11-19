import { type RefObject, useEffect, useRef } from 'react';

import { isFocusLost, trackFocusWithin } from '../utils/focus';

export function useKeepReaderFocus(
  readerRef: RefObject<HTMLElement | null>,
  leaf: number
) {
  const hasFocusRef = useRef(false);

  useEffect(() => {
    const reader = readerRef.current;

    if (!reader) return undefined;

    return trackFocusWithin(reader, {
      onFocusIn: () => {
        hasFocusRef.current = true;
      },
      onFocusLeave: () => {
        hasFocusRef.current = false;
      },
    });
  }, [readerRef]);

  useEffect(() => {
    if (hasFocusRef.current && isFocusLost()) {
      readerRef.current?.focus({ preventScroll: true });
    }
  }, [readerRef, leaf]);
}
