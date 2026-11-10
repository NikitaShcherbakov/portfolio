import { useEffect } from 'react';

import { selectIsClockRunning, usePlayerStore } from '../stores/player-store';

const tickIntervalMs = 1000;

export function usePlaybackClock() {
  const isRunning = usePlayerStore(selectIsClockRunning);
  const tick = usePlayerStore.use.tick();

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = window.setInterval(tick, tickIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning, tick]);
}
