import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getTrack, tracks } from '@/content/tracks';
import { cn } from '@/lib/utils';
import { invariant } from '@/utils/invariant';

import { usePlaylistVirtualizer } from '../hooks/use-playlist-virtualizer';
import { usePlayerStore } from '../stores/player-store';
import { padTrackNumber } from '../utils/format';
import { getMatchingIndices, getTrackSearchText } from '../utils/search-tracks';
import { PlaylistRow } from './playlist-row';
import { PlaylistSearch } from './playlist-search';

const minTrackNumberDigits = 2;
const searchTexts = tracks.map(getTrackSearchText);

type PlaylistDrawerProps = {
  id: string;
  isOpen: boolean;
};

export function PlaylistDrawer({ id, isOpen }: PlaylistDrawerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const currentIndex = usePlayerStore.use.currentIndex();
  const playTrack = usePlayerStore.use.playTrack();
  const matchingIndices = getMatchingIndices(searchTexts, query);
  const {
    scrollRef,
    listHeight,
    rowsHeight,
    virtualRows,
    isRowEntryActive,
    getStaggerStep,
    setFocusedRowIndex,
  } = usePlaylistVirtualizer({
    trackCount: tracks.length,
    matchingIndices,
    currentIndex,
    isOpen,
  });

  return (
    <div className={cn('drawer-wrap', isOpen && 'on')} inert={!isOpen}>
      <div className="drawer-clip">
        <div className="deck-drawer" id={id}>
          <div className="drawer-head">
            <PlaylistSearch query={query} onChange={setQuery} />
            <span className="drawer-count" role="status">
              {query.trim()
                ? t('player.playlist.found', {
                    count: matchingIndices.length,
                    total: tracks.length,
                  })
                : t('player.playlist.count', { count: tracks.length })}
            </span>
          </div>
          <div
            ref={scrollRef}
            className="drawer-list"
            style={{ height: listHeight }}
          >
            <ul
              className="drawer-rows"
              aria-label={t('player.playlist.label')}
              style={{ height: rowsHeight }}
            >
              {virtualRows.map((virtualRow) => {
                const trackIndex = matchingIndices[virtualRow.index];

                invariant(
                  trackIndex !== undefined,
                  `Playlist row ${String(virtualRow.index)} has no track.`
                );

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
                    staggerStep={getStaggerStep(virtualRow.index)}
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
            {matchingIndices.length === 0 && (
              <div className="drawer-empty">{t('player.playlist.empty')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
