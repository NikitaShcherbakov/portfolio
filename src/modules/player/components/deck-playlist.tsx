import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { invariant } from '@/utils/invariant';

import { ListIcon } from './deck-icons';
import { PlaylistDrawer } from './playlist-drawer';

export function DeckPlaylist() {
  const { t } = useTranslation();
  const drawerId = useId();
  const listButtonRef = useRef<HTMLButtonElement>(null);
  const [isListOpen, setIsListOpen] = useState(false);

  useEffect(() => {
    if (!isListOpen) return undefined;

    const deck = listButtonRef.current?.closest<HTMLElement>('.player-deck');

    invariant(deck, 'The playlist button is not inside the deck.');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      setIsListOpen(false);
      listButtonRef.current?.focus();
    };

    deck.addEventListener('keydown', handleKeyDown);

    return () => {
      deck.removeEventListener('keydown', handleKeyDown);
    };
  }, [isListOpen]);

  const handleToggleList = () => {
    setIsListOpen((isOpen) => !isOpen);
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
          aria-label={t('player.deck.listLabel')}
          aria-expanded={isListOpen}
          aria-controls={drawerId}
          onClick={handleToggleList}
        >
          <ListIcon />
          <span>{t('player.deck.list')}</span>
          <span className="deck-caret" aria-hidden="true">
            ▾
          </span>
        </button>
      </div>
      <PlaylistDrawer id={drawerId} isOpen={isListOpen} />
    </>
  );
}
