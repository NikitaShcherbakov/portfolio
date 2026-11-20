import { useCallback, useEffect, useRef } from 'react';

import { usePlayerStore } from '@/modules/player';

import { useMagazineStore } from '../stores/magazine-store';
import type { MagazineEntry } from '../utils/magazine-entries';
import { scrollToCenter } from '../utils/scroll-to-center';

const scrollToPlayerDelayMs = 1000;

export function useListenToBand({ track, trackIndex }: MagazineEntry) {
  const play = usePlayerStore.use.play();
  const playTrack = usePlayerStore.use.playTrack();
  const tapListen = useMagazineStore.use.tapListen();
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(scrollTimerRef.current);
    },
    []
  );

  return useCallback(() => {
    tapListen(track.id);

    if (usePlayerStore.getState().currentIndex === trackIndex) {
      play();
    } else {
      playTrack(trackIndex);
    }

    clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      scrollToCenter('.player-deck');
    }, scrollToPlayerDelayMs);
  }, [play, playTrack, tapListen, track.id, trackIndex]);
}
