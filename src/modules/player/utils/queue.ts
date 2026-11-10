export const repeatModes = {
  All: 'all',
  One: 'one',
  Off: 'off',
} as const;

export type RepeatMode = (typeof repeatModes)[keyof typeof repeatModes];

export type QueueState = {
  currentIndex: number;
  trackCount: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  shuffleSeed: number;
};

const repeatCycle: Record<RepeatMode, RepeatMode> = {
  [repeatModes.All]: repeatModes.One,
  [repeatModes.One]: repeatModes.Off,
  [repeatModes.Off]: repeatModes.All,
};

const shuffleSeedFactor = 7;
const shuffleIndexFactor = 13;
const shuffleOffset = 5;

export function getNextRepeatMode(repeatMode: RepeatMode): RepeatMode {
  return repeatCycle[repeatMode];
}

function getOtherIndices({ currentIndex, trackCount }: QueueState) {
  return Array.from({ length: trackCount }, (_, index) => index).filter(
    (index) => index !== currentIndex
  );
}

function getShuffleIndex(queue: QueueState): number {
  const pool = getOtherIndices(queue);
  const hash =
    queue.shuffleSeed * shuffleSeedFactor +
    queue.currentIndex * shuffleIndexFactor +
    shuffleOffset;

  return pool[hash % pool.length] ?? queue.currentIndex;
}

export function getManualNextIndex(queue: QueueState): number {
  if (queue.isShuffle) {
    return getShuffleIndex(queue);
  }

  return (queue.currentIndex + 1) % queue.trackCount;
}

export function getAutoNextIndex(queue: QueueState): number | null {
  if (queue.repeatMode === repeatModes.One) {
    return queue.currentIndex;
  }

  const isLastTrack = queue.currentIndex === queue.trackCount - 1;

  if (!queue.isShuffle && isLastTrack && queue.repeatMode === repeatModes.Off) {
    return null;
  }

  return getManualNextIndex(queue);
}

export function getPreviousIndex({
  currentIndex,
  trackCount,
}: QueueState): number {
  return currentIndex <= 0 ? trackCount - 1 : currentIndex - 1;
}

export function getRandomIndex(
  queue: QueueState,
  randomFraction: number
): number | null {
  const pool = getOtherIndices(queue);

  return pool[Math.floor(randomFraction * pool.length)] ?? null;
}
