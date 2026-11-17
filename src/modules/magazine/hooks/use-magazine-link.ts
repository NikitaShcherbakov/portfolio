import { useCallback } from 'react';

import { useMagazineStore } from '../stores/magazine-store';
import {
  getLeafByTrackIndex,
  getMagazinePageNumber,
} from '../utils/magazine-entries';
import { scrollToCenter } from '../utils/scroll-to-center';

export function useMagazineLink(trackIndex: number) {
  const flipTo = useMagazineStore.use.flipTo();
  const leaf = getLeafByTrackIndex(trackIndex);

  const openInMagazine = useCallback(() => {
    if (leaf === null) return;

    flipTo(leaf);
    scrollToCenter('.mag-wrap');
  }, [flipTo, leaf]);

  return {
    page: leaf === null ? null : getMagazinePageNumber(leaf),
    openInMagazine,
  };
}
