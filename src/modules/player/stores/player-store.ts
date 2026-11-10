import { create } from 'zustand';

import { getTrack, tracks } from '@/content/tracks';
import { clamp } from '@/utils/clamp';
import { createSelectors } from '@/utils/create-selectors';

import {
  getAutoNextIndex,
  getManualNextIndex,
  getNextRepeatMode,
  getPreviousIndex,
  getRandomIndex,
  type QueueState,
  type RepeatMode,
  repeatModes,
} from '../utils/queue';
import { maxVolume } from '../utils/volume-knob';

const restartThresholdSec = 3;
export const seekStepSec = 10;

type PlayerState = {
  currentIndex: number;
  isPlaying: boolean;
  isPowerOn: boolean;
  elapsed: number;
  isSeeking: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  shuffleSeed: number;
  volume: number;
  isMuted: boolean;
  volumeChangeCount: number;
};

type PlayerActions = {
  playTrack: (index: number) => void;
  togglePlay: () => void;
  togglePower: () => void;
  playPrevious: () => void;
  playNext: () => void;
  playRandom: () => void;
  tick: () => void;
  seekTo: (seconds: number) => void;
  seekBy: (deltaSec: number) => void;
  startSeeking: (fraction: number) => void;
  seekToFraction: (fraction: number) => void;
  stopSeeking: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  increaseVolume: () => void;
  decreaseVolume: () => void;
  toggleMute: () => void;
};

const initialPlayerState: PlayerState = {
  currentIndex: 0,
  isPlaying: false,
  isPowerOn: true,
  elapsed: 0,
  isSeeking: false,
  isShuffle: false,
  repeatMode: repeatModes.All,
  shuffleSeed: 0,
  volume: 7,
  isMuted: false,
  volumeChangeCount: 0,
};

export function getQueueState(state: PlayerState): QueueState {
  return {
    currentIndex: state.currentIndex,
    trackCount: tracks.length,
    isShuffle: state.isShuffle,
    repeatMode: state.repeatMode,
    shuffleSeed: state.shuffleSeed,
  };
}

export function selectIsPlaybackActive(state: PlayerState) {
  return state.isPlaying && state.isPowerOn;
}

export function selectIsClockRunning(state: PlayerState) {
  return selectIsPlaybackActive(state) && !state.isSeeking;
}

function clampToTrack(currentIndex: number, elapsed: number) {
  return clamp(elapsed, 0, getTrack(currentIndex).durationSec - 1);
}

function getSeekPosition(currentIndex: number, fraction: number) {
  return clampToTrack(
    currentIndex,
    Math.round(fraction * getTrack(currentIndex).durationSec)
  );
}

const usePlayerStoreBase = create<PlayerState & PlayerActions>()((set, get) => {
  const playTrack = (index: number) => {
    set((state) => ({
      currentIndex: index,
      elapsed: 0,
      isPlaying: true,
      isPowerOn: true,
      shuffleSeed: state.shuffleSeed + 1,
    }));
  };

  const handleTrackEnd = () => {
    const state = get();
    const nextIndex = getAutoNextIndex(getQueueState(state));

    if (nextIndex === null) {
      set({ isPlaying: false, elapsed: 0 });
    } else if (nextIndex === state.currentIndex) {
      set({ elapsed: 0, shuffleSeed: state.shuffleSeed + 1 });
    } else {
      playTrack(nextIndex);
    }
  };

  return {
    ...initialPlayerState,
    playTrack,

    togglePlay: () => {
      set((state) =>
        state.isPowerOn
          ? { isPlaying: !state.isPlaying }
          : { isPowerOn: true, isPlaying: true }
      );
    },

    togglePower: () => {
      set((state) => ({
        isPowerOn: !state.isPowerOn,
        isPlaying: !state.isPowerOn,
        isSeeking: false,
      }));
    },

    playPrevious: () => {
      const state = get();

      if (state.elapsed > restartThresholdSec) {
        set({ elapsed: 0 });
        return;
      }

      playTrack(getPreviousIndex(getQueueState(state)));
    },

    playNext: () => {
      playTrack(getManualNextIndex(getQueueState(get())));
    },

    playRandom: () => {
      const randomIndex = getRandomIndex(getQueueState(get()), Math.random());

      if (randomIndex !== null) {
        playTrack(randomIndex);
      }
    },

    tick: () => {
      const state = get();

      if (!selectIsClockRunning(state)) {
        return;
      }

      const elapsed = state.elapsed + 1;

      if (elapsed >= getTrack(state.currentIndex).durationSec) {
        handleTrackEnd();
      } else {
        set({ elapsed });
      }
    },

    seekTo: (seconds) => {
      set((state) =>
        state.isPowerOn
          ? { elapsed: clampToTrack(state.currentIndex, seconds) }
          : {}
      );
    },

    seekBy: (deltaSec) => {
      set((state) =>
        state.isPowerOn
          ? {
              elapsed: clampToTrack(
                state.currentIndex,
                state.elapsed + deltaSec
              ),
            }
          : {}
      );
    },

    startSeeking: (fraction) => {
      set((state) =>
        state.isPowerOn
          ? {
              isSeeking: true,
              elapsed: getSeekPosition(state.currentIndex, fraction),
            }
          : {}
      );
    },

    seekToFraction: (fraction) => {
      set((state) =>
        state.isSeeking
          ? { elapsed: getSeekPosition(state.currentIndex, fraction) }
          : {}
      );
    },

    stopSeeking: () => {
      set({ isSeeking: false });
    },

    toggleShuffle: () => {
      set((state) => ({
        isShuffle: !state.isShuffle,
        shuffleSeed: state.shuffleSeed + 1,
      }));
    },

    cycleRepeat: () => {
      set((state) => ({ repeatMode: getNextRepeatMode(state.repeatMode) }));
    },

    increaseVolume: () => {
      set((state) => ({
        volume: clamp(state.volume + 1, 0, maxVolume),
        isMuted: false,
        volumeChangeCount: state.volumeChangeCount + 1,
      }));
    },

    decreaseVolume: () => {
      set((state) => {
        const volume = clamp(state.volume - 1, 0, maxVolume);

        return {
          volume,
          isMuted: state.isMuted || volume === 0,
          volumeChangeCount: state.volumeChangeCount + 1,
        };
      });
    },

    toggleMute: () => {
      set((state) => {
        const isUnmutingSilence = state.isMuted && state.volume === 0;

        return {
          isMuted: !state.isMuted,
          volume: isUnmutingSilence ? 1 : state.volume,
          volumeChangeCount: state.volumeChangeCount + 1,
        };
      });
    },
  };
});

export const usePlayerStore = createSelectors(usePlayerStoreBase);
