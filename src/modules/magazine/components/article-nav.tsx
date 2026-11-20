import { useTranslation } from 'react-i18next';

import { padTwoDigits } from '@/utils/pad-two-digits';

import { useMagazineStore } from '../stores/magazine-store';
import { focusKeys } from '../utils/focus';
import {
  getEntryAtLeaf,
  getEntryName,
  lastLeaf,
  type MagazineEntry,
} from '../utils/magazine-entries';

type ArticleNavProps = {
  entry: MagazineEntry;
};

export function ArticleNav({ entry: { leaf } }: ArticleNavProps) {
  const { t } = useTranslation();
  const flipBackward = useMagazineStore.use.flipBackward();
  const goToNextBand = useMagazineStore.use.goToNextBand();
  const previous = getEntryAtLeaf(leaf - 1);
  const isLast = leaf === lastLeaf;
  const next = getEntryAtLeaf(isLast ? 1 : leaf + 1);
  const hasNext = next !== undefined && next.leaf !== leaf;

  return (
    <div className="k-nav">
      {previous ? (
        <button
          type="button"
          className="k-nav-b"
          data-focus-key={focusKeys.Previous}
          aria-label={t('magazine.nav.previous', {
            name: getEntryName(previous),
          })}
          onClick={flipBackward}
        >
          <i>←</i> {previous.track.title}
        </button>
      ) : (
        <span />
      )}
      <span className="k-nav-c">
        {t('magazine.nav.counter', {
          current: padTwoDigits(leaf),
          total: padTwoDigits(lastLeaf),
        })}
      </span>
      {hasNext ? (
        <button
          type="button"
          className="k-nav-b"
          data-focus-key={focusKeys.Next}
          aria-label={t(isLast ? 'magazine.nav.restart' : 'magazine.nav.next', {
            name: getEntryName(next),
          })}
          onClick={goToNextBand}
        >
          {next.track.title} <i>{isLast ? '↺' : '→'}</i>
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}
