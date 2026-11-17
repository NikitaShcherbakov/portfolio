import { type RefObject, useEffect, useRef } from 'react';

import { useMagazineStore } from '../stores/magazine-store';
import {
  type FocusKey,
  getFocusKey,
  restoreFocus,
  waitForTransitions,
} from '../utils/focus';

export function useKeepBookFocus(bookRef: RefObject<HTMLElement | null>) {
  const leaf = useMagazineStore.use.leaf();
  const flight = useMagazineStore.use.flight();
  const curlLeaf = useMagazineStore.use.curlLeaf();
  const isSearchOpen = useMagazineStore.use.isSearchOpen();
  const focusKeyRef = useRef<FocusKey | null>(null);

  useEffect(() => {
    const book = bookRef.current;

    if (!book) return undefined;

    const listeners = new AbortController();
    const options = { signal: listeners.signal };

    book.addEventListener(
      'focusin',
      (event) => {
        focusKeyRef.current = getFocusKey(event.target);
      },
      options
    );
    book.addEventListener(
      'focusout',
      (event) => {
        if (
          event.relatedTarget instanceof Node &&
          !book.contains(event.relatedTarget)
        ) {
          focusKeyRef.current = null;
        }
      },
      options
    );

    return () => {
      listeners.abort();
    };
  }, [bookRef]);

  useEffect(() => {
    const book = bookRef.current;

    if (!book || flight !== null || curlLeaf !== null) return undefined;

    const controller = new AbortController();

    // Under reduced motion the design gives .leaf a 10ms transition of every property, visibility
    // included, so the new page reads as hidden and cannot take focus until that transition ends.
    const restoreAfterTransitions = async () => {
      await waitForTransitions(book);

      const key = focusKeyRef.current;

      if (!controller.signal.aborted && key !== null) {
        restoreFocus(book, leaf, key);
      }
    };

    void restoreAfterTransitions();

    return () => {
      controller.abort();
    };
  }, [bookRef, leaf, flight, curlLeaf, isSearchOpen]);
}
