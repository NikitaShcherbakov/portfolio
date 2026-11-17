import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import bookOverSvg from '../assets/book-over.svg?raw';
import bookUnderSvg from '../assets/book-under.svg?raw';
import { useKeepBookFocus } from '../hooks/use-keep-book-focus';
import { useMagazineStore } from '../stores/magazine-store';
import { focusKeys } from '../utils/focus';
import { lastLeaf } from '../utils/magazine-entries';
import { getLeaves } from '../utils/pages';
import { BookLayer } from './book-layer';
import { MagazineLeaf } from './magazine-leaf';
import { MagazineTitle } from './magazine-title';

const staplePositions = ['22%', '72%'] as const;

export function Magazine() {
  const { t } = useTranslation();
  const leaf = useMagazineStore.use.leaf();
  const flight = useMagazineStore.use.flight();
  const curlLeaf = useMagazineStore.use.curlLeaf();
  const flipForward = useMagazineStore.use.flipForward();
  const flipBackward = useMagazineStore.use.flipBackward();
  const attachBook = useMagazineStore.use.attachBook();
  const bookRef = useRef<HTMLDivElement | null>(null);
  const setBook = useCallback(
    (element: HTMLDivElement | null) => {
      bookRef.current = element;
      attachBook(element);
    },
    [attachBook]
  );

  useKeepBookFocus(bookRef);

  if (lastLeaf === 0) return null;

  const isIdle = flight === null;

  return (
    <section
      aria-label={t('magazine.title')}
      className="mag-wrap"
      style={{ display: 'flex', flexDirection: 'column', gap: 22 }}
    >
      <MagazineTitle>{t('magazine.title')}</MagazineTitle>
      <div style={{ padding: '34px 2.6% 64px' }}>
        <div ref={setBook} className="book fx-duotone">
          <BookLayer svg={bookUnderSvg} />
          <button
            type="button"
            className="edge edge-l"
            data-focus-key={focusKeys.FlipBackward}
            aria-label={t('magazine.flipBackward')}
            disabled={isIdle && leaf <= 1}
            onClick={flipBackward}
          />
          <button
            type="button"
            className="edge edge-r"
            data-focus-key={focusKeys.FlipForward}
            aria-label={t('magazine.flipForward')}
            disabled={isIdle && leaf >= lastLeaf}
            onClick={flipForward}
          />
          <div className="j-mag-sh" aria-hidden="true" />
          <div className="stack-l" aria-hidden="true" />
          <div className="stack-r" aria-hidden="true" />
          {getLeaves(leaf, flight).map((leafModel) => (
            <MagazineLeaf
              key={leafModel.index}
              leaf={leafModel}
              currentLeaf={leaf}
              isCurling={curlLeaf === leafModel.index}
            />
          ))}
          {staplePositions.map((top) => (
            <div
              key={top}
              className="staple"
              aria-hidden="true"
              style={{ top }}
            />
          ))}
          <div className="j-spine" aria-hidden="true" />
          <BookLayer svg={bookOverSvg} />
        </div>
      </div>
    </section>
  );
}
