import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { selectIsPlaybackActive, usePlayerStore } from '../stores/player-store';

type DeckShellProps = {
  children: ReactNode;
};

export function DeckShell({ children }: DeckShellProps) {
  const isPlaybackActive = usePlayerStore(selectIsPlaybackActive);
  const isPowerOn = usePlayerStore.use.isPowerOn();
  const isSeeking = usePlayerStore.use.isSeeking();
  const isAtTrackStart = usePlayerStore((state) => state.elapsed <= 0);

  return (
    <div
      className={cn(
        'deck player-deck',
        isPlaybackActive ? 'is-playing' : 'is-paused',
        isPowerOn ? 'is-on' : 'is-off',
        isSeeking && 'is-seeking',
        isAtTrackStart && 'is-reset'
      )}
    >
      {children}
    </div>
  );
}
