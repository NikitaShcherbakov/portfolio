import { type KeyboardEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { ClearIcon, SearchIcon } from './deck-icons';

type PlaylistSearchProps = {
  query: string;
  onChange: (query: string) => void;
};

export function PlaylistSearch({ query, onChange }: PlaylistSearchProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && query) {
      event.preventDefault();
      event.stopPropagation();
      onChange('');
    }
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <label className="drawer-search">
      <SearchIcon />
      <input
        ref={inputRef}
        type="search"
        value={query}
        placeholder={t('player.playlist.searchPlaceholder')}
        aria-label={t('player.playlist.search')}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onKeyDown={handleKeyDown}
      />
      {query && (
        <button
          type="button"
          className="drawer-clear"
          aria-label={t('player.playlist.clearSearch')}
          onClick={handleClear}
        >
          <ClearIcon />
        </button>
      )}
    </label>
  );
}
