import { create } from 'zustand';

import { getTrack, tracks } from '@/content/tracks';
import { clamp } from '@/utils/clamp';
import { createSelectors } from '@/utils/create-selectors';

import {
  loadAudio,
  pauseAudio,
  playAudio,
  seekAudio,
  setAudioVolume,
} from '../utils/audio-element';
import {
  createShuffleOrder,
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
  isBuffering: boolean;
  failedTrackCount: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  shuffleOrder: readonly number[];
  volume: number;
  isMuted: boolean;
  volumeChangeCount: number;
};

type PlayerActions = {
  playTrack: (index: number) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  togglePower: () => void;
  playPrevious: () => void;
  playNext: () => void;
  playRandom: () => void;
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
  handleTimeUpdate: (currentTime: number) => void;
  handleBuffering: (isBuffering: boolean) => void;
  handlePlaying: () => void;
  handleExternalPlay: () => void;
  handleExternalPause: (hasEnded: boolean) => void;
  handleEnded: () => void;
  handleError: (errorCode: number | undefined) => void;
};

const initialPlayerState: PlayerState = {
  currentIndex: 0,
  isPlaying: false,
  isPowerOn: true,
  elapsed: 0,
  isSeeking: false,
  isBuffering: false,
  failedTrackCount: 0,
  isShuffle: false,
  repeatMode: repeatModes.Off,
  shuffleOrder: [],
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
    shuffleOrder: state.shuffleOrder,
  };
}

export function selectIsPlaybackActive(state: PlayerState) {
  return state.isPlaying && state.isPowerOn;
}

export function selectHasPlaybackFailed(state: PlayerState) {
  return state.failedTrackCount >= tracks.length;
}

export function selectUpNextIndex(state: PlayerState) {
  return getAutoNextIndex(getQueueState(state));
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

function getSteppedVolume(volume: number, step: number) {
  return clamp(volume + step, 0, maxVolume);
}

function applyVolume({ volume, isMuted }: PlayerState) {
  setAudioVolume(volume / maxVolume, isMuted);
}

const usePlayerStoreBase = create<PlayerState & PlayerActions>()((set, get) => {
  let playRequestId = 0;

  const startAudio = async () => {
    const state = get();
    const requestId = ++playRequestId;

    loadAudio(getTrack(state.currentIndex).audioUrl);
    applyVolume(state);

    let isStarted = false;

    try {
      isStarted = await playAudio();
    } catch (error) {
      console.error('Playback failed to start.', error);
    }

    if (!isStarted && requestId === playRequestId) {
      set({ isPlaying: false, isBuffering: false });
    }
  };

  const setPlaying = (isPlaying: boolean) => {
    set((state) => ({
      isPlaying,
      isPowerOn: true,
      failedTrackCount:
        isPlaying && selectHasPlaybackFailed(state)
          ? 0
          : state.failedTrackCount,
    }));

    if (isPlaying) {
      void startAudio();
    } else {
      pauseAudio();
    }
  };

  const seekWithinTrack = (seconds: number) => {
    const { currentIndex } = get();
    const elapsed = clampToTrack(currentIndex, seconds);

    set({ elapsed });
    seekAudio(elapsed);
  };

  const startTrack = (index: number, failedTrackCount = 0) => {
    set({
      currentIndex: index,
      elapsed: 0,
      isPlaying: true,
      isPowerOn: true,
      isBuffering: true,
      failedTrackCount,
    });
    seekAudio(0);
    void startAudio();
  };

  const updateVolume = (
    getVolume: (state: PlayerState) => Pick<PlayerState, 'volume' | 'isMuted'>
  ) => {
    set((state) => ({
      ...getVolume(state),
      volumeChangeCount: state.volumeChangeCount + 1,
    }));
    applyVolume(get());
  };

  const startPickedTrack = (index: number) => {
    if (get().isShuffle) {
      set({ shuffleOrder: createShuffleOrder(tracks.length, index) });
    }

    startTrack(index);
  };

  return {
    ...initialPlayerState,
    playTrack: (index) => {
      startPickedTrack(index);
    },

    togglePlay: () => {
      setPlaying(!selectIsPlaybackActive(get()));
    },

    play: () => {
      setPlaying(true);
    },

    pause: () => {
      setPlaying(false);
    },

    togglePower: () => {
      set((state) => ({
        isPowerOn: !state.isPowerOn,
        isPlaying: false,
        isSeeking: false,
      }));
      pauseAudio();
    },

    playPrevious: () => {
      const state = get();

      if (state.elapsed > restartThresholdSec) {
        seekWithinTrack(0);
        return;
      }

      startTrack(getPreviousIndex(getQueueState(state)));
    },

    playNext: () => {
      startTrack(getManualNextIndex(getQueueState(get())));
    },

    playRandom: () => {
      const randomIndex = getRandomIndex(getQueueState(get()), Math.random());

      if (randomIndex !== null) startPickedTrack(randomIndex);
    },

    seekTo: (seconds) => {
      if (get().isPowerOn) seekWithinTrack(seconds);
    },

    seekBy: (deltaSec) => {
      const state = get();

      if (state.isPowerOn) seekWithinTrack(state.elapsed + deltaSec);
    },

    startSeeking: (fraction) => {
      const { isPowerOn, currentIndex } = get();

      if (!isPowerOn) return;

      set({
        isSeeking: true,
        elapsed: getSeekPosition(currentIndex, fraction),
      });
    },

    seekToFraction: (fraction) => {
      const { isSeeking, currentIndex } = get();

      if (isSeeking) set({ elapsed: getSeekPosition(currentIndex, fraction) });
    },

    stopSeeking: () => {
      const state = get();

      if (!state.isSeeking) return;

      set({ isSeeking: false });
      seekAudio(state.elapsed);
    },

    toggleShuffle: () => {
      set((state) => ({
        isShuffle: !state.isShuffle,
        shuffleOrder: state.isShuffle
          ? []
          : createShuffleOrder(tracks.length, state.currentIndex),
      }));
    },

    cycleRepeat: () => {
      set((state) => ({ repeatMode: getNextRepeatMode(state.repeatMode) }));
    },

    increaseVolume: () => {
      updateVolume((state) => ({
        volume: getSteppedVolume(state.volume, 1),
        isMuted: false,
      }));
    },

    decreaseVolume: () => {
      updateVolume((state) => {
        const volume = getSteppedVolume(state.volume, -1);

        return { volume, isMuted: state.isMuted || volume === 0 };
      });
    },

    toggleMute: () => {
      updateVolume((state) => ({
        isMuted: !state.isMuted,
        volume: state.isMuted && state.volume === 0 ? 1 : state.volume,
      }));
    },

    handleTimeUpdate: (currentTime) => {
      const state = get();
      const elapsed = Math.floor(currentTime);

      if (!state.isSeeking && elapsed !== state.elapsed) {
        set({ elapsed });
      }
    },

    handleBuffering: (isBuffering) => {
      set({ isBuffering });
    },

    handlePlaying: () => {
      set({ isBuffering: false, failedTrackCount: 0 });
    },

    handleExternalPlay: () => {
      if (!get().isPlaying) set({ isPlaying: true, isPowerOn: true });
    },

    handleExternalPause: (hasEnded) => {
      if (!hasEnded && get().isPlaying) {
        set({ isPlaying: false, isBuffering: false });
      }
    },

    handleEnded: () => {
      const nextIndex = selectUpNextIndex(get());

      if (nextIndex !== null) {
        startTrack(nextIndex);
        return;
      }

      set({ isPlaying: false, elapsed: 0 });
      seekAudio(0);
    },

    handleError: (errorCode) => {
      const state = get();
      const failedTrackCount = state.failedTrackCount + 1;

      console.error(
        `Track "${getTrack(state.currentIndex).id}" failed to load (MediaError code ${String(errorCode ?? 'unknown')}).`
      );

      if (failedTrackCount >= tracks.length) {
        set({ isPlaying: false, isBuffering: false, failedTrackCount });
        pauseAudio();
        return;
      }

      if (selectIsPlaybackActive(state)) {
        startTrack(getManualNextIndex(getQueueState(state)), failedTrackCount);
      } else {
        set({ isBuffering: false, failedTrackCount });
      }
    },
  };
});

export const usePlayerStore = createSelectors(usePlayerStoreBase);
