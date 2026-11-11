import {
  useCallback,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { type Range, useVirtualizer } from '@tanstack/react-virtual';

import { clamp } from '@/utils/clamp';

import { extractRangeWithNeighbours } from '../utils/playlist-range';
import { useTransientFlag } from './use-transient-flag';

const rowHeightPx = 52;
const overscanRows = 6;
const maxStaggerStep = 12;
// Must equal the rowIn timing of the design's stylesheet, or the inline `animation: none` cuts rows off mid-entry.
const rowStaggerMs = 28;
const rowDelayMs = 80;
const rowAnimationMs = 320;
const rowEntryMs = maxStaggerStep * rowStaggerMs + rowDelayMs + rowAnimationMs;

type UsePlaylistVirtualizerOptions = {
  trackCount: number;
  matchingIndices: readonly number[];
  currentIndex: number;
  isOpen: boolean;
};

export function usePlaylistVirtualizer({
  trackCount,
  matchingIndices,
  currentIndex,
  isOpen,
}: UsePlaylistVirtualizerOptions) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null);
  const [hasOpened, setHasOpened] = useState(isOpen);
  const [isRowEntryActive, startRowEntry] = useTransientFlag(rowEntryMs);

  if (isOpen && !hasOpened) {
    setHasOpened(true);
  }

  const extractRange = useCallback(
    (range: Range) => extractRangeWithNeighbours(range, focusedRowIndex),
    [focusedRowIndex]
  );

  const virtualizer = useVirtualizer({
    count: matchingIndices.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeightPx,
    overscan: overscanRows,
    rangeExtractor: extractRange,
    enabled: hasOpened,
  });
  const firstVisibleIndex = virtualizer.range?.startIndex ?? 0;

  const getStaggerStep = useCallback(
    (rowIndex: number) =>
      clamp(rowIndex - firstVisibleIndex, 0, maxStaggerStep),
    [firstVisibleIndex]
  );

  const scrollToCurrentTrack = useEffectEvent(() => {
    const rowIndex = matchingIndices.indexOf(currentIndex);

    if (rowIndex !== -1) {
      virtualizer.scrollToIndex(rowIndex, {
        align: 'center',
        behavior: 'instant',
      });
    }
  });

  useLayoutEffect(() => {
    if (isOpen) {
      scrollToCurrentTrack();
      startRowEntry();
    }
  }, [isOpen, startRowEntry]);

  return {
    scrollRef,
    listHeight: trackCount * rowHeightPx,
    rowsHeight: virtualizer.getTotalSize(),
    virtualRows: virtualizer.getVirtualItems(),
    isRowEntryActive,
    getStaggerStep,
    setFocusedRowIndex,
  };
}
