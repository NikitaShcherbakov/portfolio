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
  shuffleOrder: readonly number[];
};

const repeatCycle: Record<RepeatMode, RepeatMode> = {
  [repeatModes.All]: repeatModes.One,
  [repeatModes.One]: repeatModes.Off,
  [repeatModes.Off]: repeatModes.All,
};

export function getNextRepeatMode(repeatMode: RepeatMode): RepeatMode {
  return repeatCycle[repeatMode];
}

export function createShuffleOrder(
  trackCount: number,
  firstIndex: number,
  getRandomFraction: () => number = Math.random
): number[] {
  const order = Array.from({ length: trackCount - 1 }, (_, index) =>
    index < firstIndex ? index : index + 1
  );

  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(getRandomFraction() * (index + 1));
    const current = order[index];
    const swapped = order[swapIndex];

    if (current === undefined || swapped === undefined) continue;

    order[index] = swapped;
    order[swapIndex] = current;
  }

  return [firstIndex, ...order];
}

function getSequentialNextIndex({ currentIndex, trackCount }: QueueState) {
  return (currentIndex + 1) % trackCount;
}

function getOtherIndex(
  { currentIndex, trackCount }: QueueState,
  position: number
): number | null {
  const otherCount = trackCount - 1;

  if (otherCount <= 0) return null;

  const otherPosition = position % otherCount;

  return otherPosition < currentIndex ? otherPosition : otherPosition + 1;
}

function getShuffleIndex(queue: QueueState): number {
  const { shuffleOrder, currentIndex, trackCount } = queue;
  const position = shuffleOrder.indexOf(currentIndex);

  if (shuffleOrder.length !== trackCount || position === -1) {
    return getSequentialNextIndex(queue);
  }

  return shuffleOrder[(position + 1) % trackCount] ?? currentIndex;
}

export function getManualNextIndex(queue: QueueState): number {
  if (queue.isShuffle) {
    return getShuffleIndex(queue);
  }

  return getSequentialNextIndex(queue);
}

export function getAutoNextIndex(queue: QueueState): number | null {
  if (queue.repeatMode === repeatModes.One) {
    return queue.currentIndex;
  }

  const lastIndex = queue.isShuffle
    ? queue.shuffleOrder.at(-1)
    : queue.trackCount - 1;

  if (
    queue.currentIndex === lastIndex &&
    queue.repeatMode === repeatModes.Off
  ) {
    return null;
  }

  return getManualNextIndex(queue);
}

export function getPreviousIndex(queue: QueueState): number {
  const { shuffleOrder, currentIndex, trackCount } = queue;

  if (queue.isShuffle && shuffleOrder.length === trackCount) {
    const position = shuffleOrder.indexOf(currentIndex);

    if (position !== -1) {
      return (
        shuffleOrder[(position - 1 + trackCount) % trackCount] ?? currentIndex
      );
    }
  }

  return currentIndex <= 0 ? trackCount - 1 : currentIndex - 1;
}

export function getRandomIndex(
  queue: QueueState,
  randomFraction: number
): number | null {
  return getOtherIndex(
    queue,
    Math.floor(randomFraction * (queue.trackCount - 1))
  );
}
