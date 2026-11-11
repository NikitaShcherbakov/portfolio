import { type KeyboardEvent, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { ListIcon } from './deck-icons';
import { PlaylistDrawer } from './playlist-drawer';

export function DeckPlaylist() {
  const { t } = useTranslation();
  const drawerId = useId();
  const listButtonRef = useRef<HTMLButtonElement>(null);
  const [isListOpen, setIsListOpen] = useState(false);

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
    <>
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
    </>
  );
}
