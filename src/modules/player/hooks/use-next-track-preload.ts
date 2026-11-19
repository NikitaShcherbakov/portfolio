import { useEffect } from 'react';

import { getTrack } from '@/content/tracks';

import {
  type PlayerState,
  selectIsPlaybackActive,
  selectUpNextIndex,
  usePlayerStore,
} from '../stores/player-store';
import { cancelAudioPreload, preloadAudio } from '../utils/audio-preloader';

const preloadLeadSec = 30;

function selectPreloadIndex(state: PlayerState) {
  const upNextIndex = selectUpNextIndex(state);
  const remainingSec = getTrack(state.currentIndex).durationSec - state.elapsed;
  const shouldPreload =
    selectIsPlaybackActive(state) &&
    remainingSec <= preloadLeadSec &&
    upNextIndex !== state.currentIndex;

  return shouldPreload ? upNextIndex : null;
}

export function useNextTrackPreload() {
  const currentIndex = usePlayerStore.use.currentIndex();
  const preloadIndex = usePlayerStore(selectPreloadIndex);

  useEffect(() => {
    if (preloadIndex !== null) preloadAudio(getTrack(preloadIndex).audioUrl);
  }, [preloadIndex]);

  useEffect(
    () => () => {
      cancelAudioPreload();
    },
    [currentIndex]
  );
}
