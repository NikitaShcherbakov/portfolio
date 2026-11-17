import { useCallback, useEffect, useRef } from 'react';

import { usePlayerStore } from '@/modules/player';

import { useMagazineStore } from '../stores/magazine-store';
import { magazineEntries, type MagazineEntry } from '../utils/magazine-entries';
import { scrollToCenter } from '../utils/scroll-to-center';

const scrollToPlayerDelayMs = 1000;

function useStartTrack() {
  const play = usePlayerStore.use.play();
  const playTrack = usePlayerStore.use.playTrack();

  return useCallback(
    (trackIndex: number) => {
      if (usePlayerStore.getState().currentIndex === trackIndex) {
        play();
      } else {
        playTrack(trackIndex);
      }
    },
    [play, playTrack]
  );
}

export function useListenToBand({ track, trackIndex }: MagazineEntry) {
  const startTrack = useStartTrack();
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
    startTrack(trackIndex);

    clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      scrollToCenter('.player-deck');
    }, scrollToPlayerDelayMs);
  }, [startTrack, tapListen, track.id, trackIndex]);
}

export function useRandomBand({ leaf: currentLeaf }: MagazineEntry) {
  const startTrack = useStartTrack();
  const flipTo = useMagazineStore.use.flipTo();
  const canOpenRandomBand = magazineEntries.length > 1;

  const openRandomBand = useCallback(() => {
    const pool = magazineEntries.filter(({ leaf }) => leaf !== currentLeaf);
    const picked = pool[Math.floor(Math.random() * pool.length)];

    if (!picked) return;

    startTrack(picked.trackIndex);
    flipTo(picked.leaf);
  }, [currentLeaf, flipTo, startTrack]);

  return { canOpenRandomBand, openRandomBand };
}
