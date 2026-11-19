import { type CSSProperties, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { invariant } from '@/utils/invariant';

import { useElementHeight } from '../hooks/use-element-height';
import { useKeepReaderFocus } from '../hooks/use-keep-reader-focus';
import {
  readerPageGapPx,
  useReaderCarousel,
} from '../hooks/use-reader-carousel';
import { useMagazineStore } from '../stores/magazine-store';
import {
  getEntryAtLeaf,
  getEntryName,
  lastLeaf,
} from '../utils/magazine-entries';
import { ReaderSheet } from './reader-sheet';
import { ReaderSheetSizer } from './reader-sheet-sizer';

export function MagazineReader() {
  const { t } = useTranslation();
  const leaf = useMagazineStore.use.leaf();
  const flipForward = useMagazineStore.use.flipForward();
  const flipBackward = useMagazineStore.use.flipBackward();
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<HTMLElement>(null);
  const sizerRef = useRef<HTMLDivElement>(null);
  const { peek, isDragging } = useReaderCarousel({ stageRef, trackRef }, leaf);
  const sheetHeight = useElementHeight(sizerRef);

  useKeepReaderFocus(readerRef, leaf);

  const entry = getEntryAtLeaf(leaf);

  invariant(entry, `The magazine has no article at leaf ${String(leaf)}.`);

  const peekEntry = peek ? getEntryAtLeaf(peek.leaf) : undefined;
  const stageStyle: CSSProperties & { '--reader-sheet-height'?: string } =
    sheetHeight === null
      ? {}
      : { '--reader-sheet-height': `${String(sheetHeight)}px` };

  return (
    <div
      ref={stageRef}
      className="mag-reader-stage"
      data-turning={peek ? '' : undefined}
      data-dragging={isDragging ? '' : undefined}
      style={stageStyle}
    >
      <ReaderSheetSizer ref={sizerRef} />
      <div ref={trackRef} className="mag-reader-track">
        <article
          ref={readerRef}
          className="mag-reader fx-duotone"
          aria-label={getEntryName(entry)}
          tabIndex={-1}
        >
          <button
            type="button"
            className="mag-reader-edge mag-reader-edge-previous"
            aria-label={t('magazine.flipBackward')}
            disabled={leaf <= 1}
            onClick={flipBackward}
          />
          <button
            type="button"
            className="mag-reader-edge mag-reader-edge-next"
            aria-label={t('magazine.flipForward')}
            disabled={leaf >= lastLeaf}
            onClick={flipForward}
          />
          <ReaderSheet entry={entry} isCurrent />
        </article>
        {peek && peekEntry && (
          <div
            className="mag-reader mag-reader-peek fx-duotone"
            aria-hidden="true"
            inert
            style={{
              left: `calc(${String(peek.side * 100)}% + ${String(peek.side * readerPageGapPx)}px)`,
            }}
          >
            <ReaderSheet entry={peekEntry} isCurrent={false} />
          </div>
        )}
      </div>
    </div>
  );
}
