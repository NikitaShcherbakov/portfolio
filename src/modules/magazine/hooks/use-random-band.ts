import { useCallback } from 'react';

import { invariant } from '@/utils/invariant';

import { useMagazineStore } from '../stores/magazine-store';
import {
  lastLeaf,
  magazineEntries,
  type MagazineEntry,
} from '../utils/magazine-entries';

const canOpenRandomBand = lastLeaf > 1;

export function useRandomBand({ leaf: currentLeaf }: MagazineEntry) {
  const flipTo = useMagazineStore.use.flipTo();

  const openRandomBand = useCallback(() => {
    const otherEntries = magazineEntries.filter(
      ({ leaf }) => leaf !== currentLeaf
    );
    const randomEntry =
      otherEntries[Math.floor(Math.random() * otherEntries.length)];

    invariant(randomEntry, 'The magazine has no other article to open.');

    flipTo(randomEntry.leaf);
  }, [currentLeaf, flipTo]);

  return { canOpenRandomBand, openRandomBand };
}
