import { type PointerEvent, useCallback, useEffect, useRef } from 'react';

import { usePlayerStore } from '../stores/player-store';

const primaryButton = 0;

export function useSeekDrag() {
  const startSeeking = usePlayerStore.use.startSeeking();
  const seekToFraction = usePlayerStore.use.seekToFraction();
  const stopSeeking = usePlayerStore.use.stopSeeking();
  const stopDragRef = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      stopDragRef.current?.();
    },
    []
  );

  return useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.button !== primaryButton) {
        return;
      }

      // preventDefault stops text selection during the drag, but it also cancels the default focus on press.
      event.preventDefault();
      event.currentTarget.focus({ preventScroll: true });
      stopDragRef.current?.();

      const { pointerId } = event;
      const rect = event.currentTarget.getBoundingClientRect();
      const getFraction = (clientX: number) =>
        (clientX - rect.left) / rect.width;
      const listeners = new AbortController();
      const listenerOptions = { signal: listeners.signal };

      const stopDrag = () => {
        listeners.abort();
        stopDragRef.current = null;
        stopSeeking();
      };

      const handleMove = (moveEvent: globalThis.PointerEvent) => {
        if (moveEvent.pointerId === pointerId) {
          seekToFraction(getFraction(moveEvent.clientX));
        }
      };

      const handleRelease = (releaseEvent: globalThis.PointerEvent) => {
        if (releaseEvent.pointerId === pointerId) {
          stopDrag();
        }
      };

      startSeeking(getFraction(event.clientX));
      window.addEventListener('pointermove', handleMove, listenerOptions);
      window.addEventListener('pointerup', handleRelease, listenerOptions);
      window.addEventListener('pointercancel', handleRelease, listenerOptions);
      stopDragRef.current = stopDrag;
    },
    [seekToFraction, startSeeking, stopSeeking]
  );
}
