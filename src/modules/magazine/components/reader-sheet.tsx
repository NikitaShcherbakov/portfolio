import { padTwoDigits } from '@/utils/pad-two-digits';

import {
  getMagazinePageNumber,
  type MagazineEntry,
} from '../utils/magazine-entries';
import { ArticlePage } from './article-page';
import { CoverPage } from './cover-page';

type ReaderSheetProps = {
  entry: MagazineEntry;
  isCurrent: boolean;
};

export function ReaderSheet({ entry, isCurrent }: ReaderSheetProps) {
  const backdropUrl = entry.track.coverThumbUrl ?? entry.track.coverUrl;

  return (
    <>
      <div className="mag-reader-cover">
        {backdropUrl && (
          <span
            className="mag-reader-cover-backdrop"
            aria-hidden="true"
            style={{ backgroundImage: `url("${backdropUrl}")` }}
          />
        )}
        <CoverPage
          key={entry.track.id}
          entry={entry}
          number={padTwoDigits(getMagazinePageNumber(entry.leaf))}
        />
      </div>
      <div className="mag-reader-page">
        <ArticlePage entry={entry} isCurrent={isCurrent} isReader />
      </div>
    </>
  );
}
