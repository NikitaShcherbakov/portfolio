import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { useRandomBand } from '../hooks/use-random-band';
import { useMagazineStore } from '../stores/magazine-store';
import { focusKeys } from '../utils/focus';
import type { MagazineEntry } from '../utils/magazine-entries';
import { BallIcon, LensIcon } from './article-tool-icons';
import { SearchPill } from './search-pill';

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
          aria-label={t('magazine.search.open')}
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
