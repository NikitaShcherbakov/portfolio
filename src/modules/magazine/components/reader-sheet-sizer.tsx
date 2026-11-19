import type { Ref } from 'react';

import { magazineEntries } from '../utils/magazine-entries';
import { ReaderSheet } from './reader-sheet';

type ReaderSheetSizerProps = {
  ref: Ref<HTMLDivElement>;
};

export function ReaderSheetSizer({ ref }: ReaderSheetSizerProps) {
  return (
    <div ref={ref} className="mag-reader-sizer" aria-hidden="true" inert>
      {magazineEntries.map((entry) => (
        <div key={entry.track.id} className="mag-reader fx-duotone">
          <ReaderSheet entry={entry} isCurrent={false} />
        </div>
      ))}
    </div>
  );
}
