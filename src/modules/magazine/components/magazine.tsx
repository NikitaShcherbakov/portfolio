import { useTranslation } from 'react-i18next';

import { useIsReaderLayout } from '../hooks/use-is-reader-layout';
import { lastLeaf } from '../utils/magazine-entries';
import { MagazineBook } from './magazine-book';
import { MagazineReader } from './magazine-reader';
import { MagazineTitle } from './magazine-title';

export function Magazine() {
  const { t } = useTranslation();
  const isReaderLayout = useIsReaderLayout();

  if (lastLeaf === 0) return null;

  return (
    <section
      aria-label={t('magazine.title')}
      className="mag-wrap"
      tabIndex={-1}
      style={{ display: 'flex', flexDirection: 'column', gap: 22 }}
    >
      <MagazineTitle>{t('magazine.title')}</MagazineTitle>
      {isReaderLayout ? <MagazineReader /> : <MagazineBook />}
    </section>
  );
}
