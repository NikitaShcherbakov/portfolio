import {
  type KeyboardEvent,
  useCallback,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  defaultRangeExtractor,
  type Range,
  useVirtualizer,
} from '@tanstack/react-virtual';

import { getTrack, tracks } from '@/content/tracks';
import { cn } from '@/lib/utils';
import { clamp } from '@/utils/clamp';

import { useTransientFlag } from '../hooks/use-transient-flag';
import { usePlayerStore } from '../stores/player-store';
import { padTrackNumber } from '../utils/format';
import { getMatchingIndices, getTrackSearchText } from '../utils/search-tracks';
import { SearchIcon } from './deck-icons';
import { PlaylistRow } from './playlist-row';

const rowHeightPx = 52;
const overscanRows = 6;
const maxStaggerStep = 12;
// Must equal the rowIn timing of the design's stylesheet, or the inline `animation: none` cuts rows off mid-entry.
const rowStaggerMs = 28;
const rowDelayMs = 80;
const rowAnimationMs = 320;
const rowEntryMs = maxStaggerStep * rowStaggerMs + rowDelayMs + rowAnimationMs;
const minTrackNumberDigits = 2;
const searchTexts = tracks.map(getTrackSearchText);

type PlaylistDrawerProps = {
  id: string;
  isOpen: boolean;
  onClose: () => void;
};

export function PlaylistDrawer({ id, isOpen, onClose }: PlaylistDrawerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null);
  const [isRowEntryActive, startRowEntry] = useTransientFlag(rowEntryMs);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentIndex = usePlayerStore.use.currentIndex();
  const playTrack = usePlayerStore.use.playTrack();
  const matchingIndices = useMemo(
    () => getMatchingIndices(searchTexts, query),
    [query]
  );

  const extractRange = useCallback(
    (range: Range) => {
      if (focusedRowIndex === null) {
        return defaultRangeExtractor(range);
      }

      const neighbours = [
        focusedRowIndex - 1,
        focusedRowIndex,
        focusedRowIndex + 1,
      ].filter((index) => index >= 0 && index < range.count);

      return [
        ...new Set([...defaultRangeExtractor(range), ...neighbours]),
      ].sort((a, b) => a - b);
    },
    [focusedRowIndex]
  );

  const virtualizer = useVirtualizer({
    count: matchingIndices.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeightPx,
    overscan: overscanRows,
    rangeExtractor: extractRange,
  });
  const virtualRows = virtualizer.getVirtualItems();
  const firstVisibleIndex = virtualizer.range?.startIndex ?? 0;

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

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && query) {
      event.preventDefault();
      event.stopPropagation();
      setQuery('');
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y-x/no-static-element-interactions -- the container only catches Escape bubbling up from the search field and rows inside it
    <div
      className={cn('drawer-wrap', isOpen && 'on')}
      inert={!isOpen}
      onKeyDown={handleKeyDown}
    >
      <div className="drawer-clip">
        <div className="deck-drawer" id={id}>
          <div className="drawer-head">
            <label className="drawer-search">
              <SearchIcon />
              <input
                type="search"
                value={query}
                placeholder={t('player.playlist.searchPlaceholder')}
                aria-label={t('player.playlist.search')}
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
                onKeyDown={handleSearchKeyDown}
              />
            </label>
            <span className="drawer-count" role="status">
              {query.trim()
                ? t('player.playlist.found', {
                    count: matchingIndices.length,
                    total: tracks.length,
                  })
                : t('player.playlist.count', { count: tracks.length })}
            </span>
          </div>
          <div ref={scrollRef} className="drawer-list">
            <ul
              className="drawer-rows"
              aria-label={t('player.playlist.label')}
              style={{ height: virtualizer.getTotalSize() }}
            >
              {virtualRows.map((virtualRow) => {
                const trackIndex = matchingIndices[virtualRow.index];

                if (trackIndex === undefined) {
                  throw new Error(
                    `Playlist row ${String(virtualRow.index)} has no track.`
                  );
                }

                const track = getTrack(trackIndex);

                return (
                  <PlaylistRow
                    key={track.id}
                    track={track}
                    trackNumber={padTrackNumber(
                      trackIndex + 1,
                      tracks.length,
                      minTrackNumberDigits
                    )}
                    isCurrent={trackIndex === currentIndex}
                    rowIndex={virtualRow.index}
                    listSize={matchingIndices.length}
                    top={virtualRow.start}
                    staggerStep={clamp(
                      virtualRow.index - firstVisibleIndex,
                      0,
                      maxStaggerStep
                    )}
                    isEntering={isRowEntryActive}
                    onSelect={() => {
                      playTrack(trackIndex);
                    }}
                    onFocus={() => {
                      setFocusedRowIndex(virtualRow.index);
                    }}
                  />
                );
              })}
            </ul>
          </div>
          {matchingIndices.length === 0 && (
            <div className="drawer-empty">{t('player.playlist.empty')}</div>
          )}
        </div>
      </div>
    </div>
  );
}
