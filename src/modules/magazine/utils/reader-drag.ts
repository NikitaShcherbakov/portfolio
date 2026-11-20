import { lastLeaf } from './magazine-entries';

const commitShare = 0.25;
const flingPxPerMs = 0.45;
const flingWindowMs = 100;

export type ReaderSide = 1 | -1;

type PointerSample = {
  x: number;
  time: number;
};

export type ReaderDrag = {
  pointerId: number;
  startX: number;
  startY: number;
  isDragging: boolean;
  offset: number;
  samples: PointerSample[];
};

export function addPointerSample(
  samples: readonly PointerSample[],
  sample: PointerSample
) {
  return [
    ...samples.filter(({ time }) => sample.time - time <= flingWindowMs),
    sample,
  ];
}

function getReleaseVelocity(
  samples: readonly PointerSample[],
  releaseTime: number
) {
  const [first] = samples;
  const last = samples.at(-1);

  if (!first || !last || first.time === last.time) return 0;

  const isHeldStill = releaseTime - last.time > flingWindowMs;

  return isHeldStill ? 0 : (last.x - first.x) / (last.time - first.time);
}

export function getDragSide(dx: number): ReaderSide {
  return dx < 0 ? 1 : -1;
}

export function getOppositeSide(side: ReaderSide): ReaderSide {
  return side === 1 ? -1 : 1;
}

export function isLeafInMagazine(leaf: number) {
  return leaf >= 1 && leaf <= lastLeaf;
}

export function isTurnGesture(
  { offset, samples }: ReaderDrag,
  span: number,
  releaseTime: number
) {
  const isFar = Math.abs(offset) > span * commitShare;
  const towardTurn = -getDragSide(offset);

  return (
    isFar ||
    getReleaseVelocity(samples, releaseTime) * towardTurn > flingPxPerMs
  );
}
