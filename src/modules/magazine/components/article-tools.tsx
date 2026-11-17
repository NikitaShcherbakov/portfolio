import { type KeyboardEvent, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { padTwoDigits } from '@/utils/pad-two-digits';

import { useRandomBand } from '../hooks/use-band-playback';
import { useMagazineStore } from '../stores/magazine-store';
import { focusKeys } from '../utils/focus';
import type { MagazineEntry } from '../utils/magazine-entries';
import { searchBands } from '../utils/search-bands';

const focusDelayMs = 60;

type StickerIconProps = {
  label: string;
};

function LensIcon({ label }: StickerIconProps) {
  return (
    <svg className="j-ico" viewBox="0 0 80 80" aria-hidden="true">
      <path
        d="M54 54 L74 74"
        stroke="#5a3418"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle
        cx="34"
        cy="34"
        r="26"
        fill="#bfe6ff"
        stroke="#222"
        strokeWidth="5"
      />
      <path
        d="M20 26 Q24 16 34 15"
        stroke="#fff"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <text
        x="34"
        y="38.5"
        textAnchor="middle"
        fontFamily="Oswald,Arial Narrow,sans-serif"
        fontWeight="700"
        fontSize="11"
        fill="#2a0d12"
      >
        {label}
      </text>
    </svg>
  );
}

function BallIcon({ label }: StickerIconProps) {
  return (
    <svg className="j-ico" viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="36" fill="#111" />
      <path
        d="M18 26 A26 26 0 0 1 40 12"
        stroke="rgba(255,255,255,.35)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="40" cy="42" r="17" fill="#1d2f6b" />
      <polygon points="40,29 53,51 27,51" fill="#2d6bff" />
      <text
        x="40"
        y="47"
        textAnchor="middle"
        fontFamily="Oswald,Arial Narrow,sans-serif"
        fontWeight="700"
        fontSize="7.5"
        fill="#fff"
      >
        {label}
      </text>
    </svg>
  );
}

type SearchPillProps = {
  isCurrent: boolean;
  onClose: () => void;
};

function SearchPill({ isCurrent, onClose }: SearchPillProps) {
  const { t } = useTranslation();
  const query = useMagazineStore.use.query();
  const setQuery = useMagazineStore.use.setQuery();
  const flipTo = useMagazineStore.use.flipTo();
  const inputRef = useRef<HTMLInputElement>(null);
  const results = searchBands(query);

  useEffect(() => {
    if (!isCurrent) return undefined;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, focusDelayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [isCurrent]);

  const getSearchStatus = () => {
    if (!query.trim()) return '';

    return results.length === 0
      ? t('magazine.search.empty')
      : t('magazine.search.found', { count: results.length });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') onClose();

    const [firstResult] = results;

    if (event.key === 'Enter' && firstResult) flipTo(firstResult.leaf);
  };

  return (
    <span className="j-pill">
      <input
        ref={inputRef}
        className="j-find-in"
        data-focus-key={focusKeys.Search}
        type="search"
        value={query}
        placeholder={t('magazine.search.placeholder')}
        aria-label={t('magazine.search.input')}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        className="j-x"
        data-focus-key={focusKeys.Search}
        aria-label={t('magazine.search.close')}
        onClick={onClose}
      >
        ×
      </button>
      <span className="mag-sr-only" role="status">
        {getSearchStatus()}
      </span>
    </span>
  );
}

type ArticleToolsProps = {
  entry: MagazineEntry;
  isCurrent: boolean;
};

export function ArticleTools({ entry, isCurrent }: ArticleToolsProps) {
  const { t } = useTranslation();
  const isSearchOpen = useMagazineStore.use.isSearchOpen();
  const openSearch = useMagazineStore.use.openSearch();
  const closeSearch = useMagazineStore.use.closeSearch();
  const { canOpenRandomBand, openRandomBand } = useRandomBand(entry);
  const lensRef = useRef<HTMLButtonElement>(null);

  const handleSearchClose = () => {
    closeSearch();
    lensRef.current?.focus();
  };

  return (
    <div className="j-hdr">
      <span className="j-tools">
        {isSearchOpen && (
          <SearchPill isCurrent={isCurrent} onClose={handleSearchClose} />
        )}
        <button
          ref={lensRef}
          type="button"
          className={cn('j-stk j-lens', isSearchOpen && 'on')}
          data-focus-key={focusKeys.Search}
          aria-label={t(
            isSearchOpen ? 'magazine.search.close' : 'magazine.search.open'
          )}
          aria-expanded={isSearchOpen}
          onClick={isSearchOpen ? closeSearch : openSearch}
        >
          <LensIcon label={t('magazine.search.sticker')} />
        </button>
        <button
          type="button"
          className="j-stk j-ball"
          data-focus-key={focusKeys.Random}
          aria-label={t('magazine.random.label')}
          disabled={!canOpenRandomBand}
          onClick={openRandomBand}
        >
          <BallIcon label={t('magazine.random.sticker')} />
        </button>
      </span>
    </div>
  );
}

export function SearchResults() {
  const { t } = useTranslation();
  const isSearchOpen = useMagazineStore.use.isSearchOpen();
  const query = useMagazineStore.use.query();
  const flipTo = useMagazineStore.use.flipTo();

  if (!isSearchOpen || !query.trim()) return null;

  const results = searchBands(query);

  return (
    <ul className="j-res" aria-label={t('magazine.search.results')}>
      <li className="j-res-cap" aria-hidden="true">
        {t('magazine.search.caption')}
      </li>
      {results.map(({ band, track, leaf }) => (
        <li key={track.id}>
          <button
            type="button"
            data-focus-key={focusKeys.Search}
            onClick={() => {
              flipTo(leaf);
            }}
          >
            <b>{`${band.name} · ${track.title}`}</b>
            <i>{t('magazine.search.page', { page: padTwoDigits(leaf * 2) })}</i>
          </button>
        </li>
      ))}
      {results.length === 0 && (
        <li className="j-res-empty">{t('magazine.search.empty')}</li>
      )}
    </ul>
  );
}
