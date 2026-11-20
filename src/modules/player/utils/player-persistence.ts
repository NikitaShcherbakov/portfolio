import * as z from 'zod/mini';
import type { PersistStorage } from 'zustand/middleware';

import { getTrack, tracks } from '@/content/tracks';
import { clamp } from '@/utils/clamp';
import {
  readStoredValue,
  removeStoredValue,
  writeStoredValue,
} from '@/utils/storage';

import { createShuffleOrder, type QueueState, repeatModes } from './queue';
import { maxVolume } from './volume-knob';

export const playerStorageKey = 'player';
export const playerStorageVersion = 1;

const persistedPlayerSchema = z.object({
  trackId: z.string(),
  elapsed: z.number(),
  volume: z.number(),
  isMuted: z.boolean(),
  isShuffle: z.boolean(),
  repeatMode: z.enum(repeatModes),
});

const storedPlayerSchema = z.object({
  state: persistedPlayerSchema,
  version: z.literal(playerStorageVersion),
});

type PersistedPlayer = z.infer<typeof persistedPlayerSchema>;

type RestorableState = Omit<PersistedPlayer, 'trackId'> &
  Pick<QueueState, 'currentIndex' | 'shuffleOrder'>;

function parseStoredPlayer(value: string) {
  try {
    return storedPlayerSchema.safeParse(JSON.parse(value));
  } catch {
    // Text that is not JSON is the same stale or foreign value as a wrong shape: it is dropped below.
    return null;
  }
}

export const playerStorage: PersistStorage<PersistedPlayer> = {
  getItem: (name) => {
    const value = readStoredValue(name);

    if (value === null) return null;

    const result = parseStoredPlayer(value);

    if (result?.success) return result.data;

    removeStoredValue(name);

    return null;
  },
  setItem: (name, value) => {
    writeStoredValue(name, JSON.stringify(value));
  },
  removeItem: removeStoredValue,
};

export function getPersistedPlayer(state: RestorableState): PersistedPlayer {
  return {
    trackId: getTrack(state.currentIndex).id,
    elapsed: state.elapsed,
    volume: state.volume,
    isMuted: state.isMuted,
    isShuffle: state.isShuffle,
    repeatMode: state.repeatMode,
  };
}

export function mergePersistedPlayer<State extends RestorableState>(
  persisted: unknown,
  current: State
): State {
  const result = persistedPlayerSchema.safeParse(persisted);

  if (!result.success) return current;

  const { trackId, elapsed, volume, isMuted, isShuffle, repeatMode } =
    result.data;
  const trackIndex = tracks.findIndex(({ id }) => id === trackId);
  const track = tracks[trackIndex];
  const currentIndex = track ? trackIndex : current.currentIndex;

  return {
    ...current,
    currentIndex,
    elapsed: track ? clamp(Math.floor(elapsed), 0, track.durationSec - 1) : 0,
    volume: clamp(Math.round(volume), 0, maxVolume),
    isMuted,
    isShuffle,
    repeatMode,
    shuffleOrder: isShuffle
      ? createShuffleOrder(tracks.length, currentIndex)
      : [],
  };
}
