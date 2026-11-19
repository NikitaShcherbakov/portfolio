import { useTranslation } from 'react-i18next';

import { padTwoDigits } from '@/utils/pad-two-digits';

import { useMagazineStore } from '../stores/magazine-store';
import { focusKeys } from '../utils/focus';
import { getMagazinePageNumber } from '../utils/magazine-entries';
import { searchBands } from '../utils/search-bands';

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
            <i>
              {t('magazine.search.page', {
                page: padTwoDigits(getMagazinePageNumber(leaf)),
              })}
            </i>
          </button>
        </li>
      ))}
      {results.length === 0 && (
        <li className="j-res-empty">{t('magazine.search.empty')}</li>
      )}
    </ul>
  );
}
