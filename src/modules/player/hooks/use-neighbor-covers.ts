import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { getTrack } from '@/content/tracks';

import { getQueueState, usePlayerStore } from '../stores/player-store';
import { preloadCover } from '../utils/cover-preload';
import {
  getAutoNextIndex,
  getManualNextIndex,
  getPreviousIndex,
} from '../utils/queue';

export function useNeighborCovers() {
  const neighborIndices = usePlayerStore(
    useShallow((state) => {
      const queue = getQueueState(state);

      return [
        state.currentIndex,
        getAutoNextIndex(queue),
        getManualNextIndex(queue),
        getPreviousIndex(queue),
      ];
    })
  );

  useEffect(() => {
    for (const index of neighborIndices) {
      if (index !== null) void preloadCover(getTrack(index).coverUrl);
    }
  }, [neighborIndices]);
}
