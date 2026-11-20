import { padTwoDigits } from '@/utils/pad-two-digits';

import {
  getMagazinePageNumber,
  magazineEntries,
  type MagazineEntry,
} from './magazine-entries';

export type MagazinePage =
  | { kind: 'blank' }
  | { kind: 'cover' | 'article'; entry: MagazineEntry; number: string };

export type Flight = {
  from: number;
  to: number;
  flipLeaf: number;
};

const leafStates = {
  Visible: '',
  Prepared: 'pre',
  Off: 'off',
} as const;

type LeafState = (typeof leafStates)[keyof typeof leafStates];

export type LeafModel = {
  index: number;
  front: MagazinePage | undefined;
  back: MagazinePage | undefined;
  rotation: number;
  zIndex: number;
  state: LeafState;
};

const turnedRotation = -180;
const hiddenZIndex = 1;
const shownZIndexBase = 10;

function createPages(): MagazinePage[] {
  const bandPages = magazineEntries.flatMap((entry): MagazinePage[] => {
    const coverNumber = getMagazinePageNumber(entry.leaf);

    return [
      { kind: 'cover', entry, number: padTwoDigits(coverNumber) },
      { kind: 'article', entry, number: padTwoDigits(coverNumber + 1) },
    ];
  });

  return [{ kind: 'blank' }, ...bandPages, { kind: 'blank' }];
}

const pages = createPages();

const leafCount = pages.length / 2;

function getShownLeaves(leaf: number, flight: Flight | null) {
  const shown = new Set([leaf - 2, leaf - 1, leaf, leaf + 1]);

  if (flight) {
    [
      flight.from - 1,
      flight.from,
      flight.to - 1,
      flight.to,
      flight.flipLeaf,
    ].forEach((index) => shown.add(index));
  }

  return shown;
}

function getLeafState(index: number, leaf: number, flight: Flight | null) {
  if (flight === null) {
    return index === leaf + 1 || index === leaf - 2
      ? leafStates.Prepared
      : leafStates.Visible;
  }

  const isBetweenFlight =
    index > Math.min(flight.from, flight.to) &&
    index < Math.max(flight.from, flight.to) &&
    index !== flight.flipLeaf;

  return isBetweenFlight ? leafStates.Prepared : leafStates.Visible;
}

function getBackPage(index: number, flight: Flight | null) {
  if (flight?.flipLeaf === index) {
    return pages[(Math.max(flight.from, flight.to) - 1) * 2 + 1];
  }

  return pages[index * 2 + 1];
}

export function getLeaves(leaf: number, flight: Flight | null): LeafModel[] {
  const shown = getShownLeaves(leaf, flight);
  const shownInRange = [...shown]
    .filter((index) => index >= 0 && index < leafCount)
    .toSorted((first, second) => first - second);
  const lowest = shownInRange[0] ?? 0;
  const highest = shownInRange.at(-1) ?? 0;

  return Array.from({ length: leafCount }, (_, index) => {
    const isTurned = index < leaf;
    const rotation = isTurned ? turnedRotation : 0;

    if (!shown.has(index)) {
      return {
        index,
        front: undefined,
        back: undefined,
        rotation,
        zIndex: hiddenZIndex,
        state: leafStates.Off,
      };
    }

    return {
      index,
      front: pages[index * 2],
      back: getBackPage(index, flight),
      rotation,
      zIndex: shownZIndexBase + (isTurned ? index - lowest : highest - index),
      state: getLeafState(index, leaf, flight),
    };
  });
}
