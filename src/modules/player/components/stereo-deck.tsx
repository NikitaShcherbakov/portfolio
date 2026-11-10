import { type KeyboardEvent, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { selectIsPlaybackActive, usePlayerStore } from '../stores/player-store';
import { CornerScrews } from './corner-screws';
import { DeckHeader } from './deck-header';
import { ListIcon } from './deck-icons';
import { DeckJacks } from './deck-jacks';
import { DeckScreen } from './deck-screen';
import { DeckTime } from './deck-time';
import { DeckTransport } from './deck-transport';
import { DeckVolume } from './deck-volume';
import { DiscBay } from './disc-bay';
import { PlaylistDrawer } from './playlist-drawer';

export function StereoDeck() {
  const { t } = useTranslation();
  const drawerId = useId();
  const listButtonRef = useRef<HTMLButtonElement>(null);
  const [isListOpen, setIsListOpen] = useState(false);
  const isPlaybackActive = usePlayerStore(selectIsPlaybackActive);
  const isPowerOn = usePlayerStore.use.isPowerOn();
  const isSeeking = usePlayerStore.use.isSeeking();
  const isAtTrackStart = usePlayerStore((state) => state.elapsed <= 0);

  const handleToggleList = () => {
    setIsListOpen((isOpen) => !isOpen);
  };

  const handleCloseList = () => {
    setIsListOpen(false);
    listButtonRef.current?.focus();
  };

  const handleListKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape' && isListOpen) {
      setIsListOpen(false);
    }
  };

  return (
    <div
      className={cn(
        'deck player-deck',
        isPlaybackActive ? 'is-playing' : 'is-paused',
        isPowerOn ? 'is-on' : 'is-off',
        isSeeking && 'is-seeking',
        isAtTrackStart && 'is-reset'
      )}
    >
      <CornerScrews className="screw" offset={12} />
      <DeckHeader />
      <div className="deck-grid">
        <div className="deck-mid">
          <div className="hp">
            <CornerScrews className="hp-screw" offset={8} />
            <DeckScreen />
            <div className="hp-lower">
              <DeckTransport />
              <div className="hp-row2">
                <DeckVolume />
                <DeckTime />
              </div>
            </div>
            <DeckJacks />
          </div>
        </div>
        <DiscBay />
      </div>
      <div className="deck-source">
        <span className="deck-src-label">{t('player.deck.source')}</span>
        <span className="hp-spacer" />
        <button
          ref={listButtonRef}
          type="button"
          className={cn('deck-act', isListOpen && 'on')}
          aria-expanded={isListOpen}
          aria-controls={drawerId}
          onClick={handleToggleList}
          onKeyDown={handleListKeyDown}
        >
          <ListIcon />
          <span>{t('player.deck.list')}</span>
          <span className="deck-caret" aria-hidden="true">
            ▾
          </span>
        </button>
      </div>
      <PlaylistDrawer
        id={drawerId}
        isOpen={isListOpen}
        onClose={handleCloseList}
      />
    </div>
  );
}
