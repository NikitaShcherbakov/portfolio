import { type KeyboardEvent, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useMagazineStore } from '../stores/magazine-store';
import { focusKeys } from '../utils/focus';
import { searchBands } from '../utils/search-bands';

const focusDelayMs = 60;

type SearchPillProps = {
  isCurrent: boolean;
  onClose: () => void;
};

export function SearchPill({ isCurrent, onClose }: SearchPillProps) {
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
    if (event.key === 'Escape') {
      onClose();
      return;
    }

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
