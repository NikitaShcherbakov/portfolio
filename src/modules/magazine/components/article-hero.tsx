import { useTranslation } from 'react-i18next';

import { useIsReaderLayout } from '../hooks/use-is-reader-layout';
import { getHeroImage, getNameSize } from '../utils/article';
import type { MagazineEntry } from '../utils/magazine-entries';
import { MagazineImage } from './magazine-image';

type ArticleHeroProps = {
  entry: MagazineEntry;
  origin: string;
};

export function ArticleHero({ entry, origin }: ArticleHeroProps) {
  const { t } = useTranslation();
  const isReaderLayout = useIsReaderLayout();
  const { band, track, leaf } = entry;
  const { isPhoto, ...heroImage } = getHeroImage(entry);

  return (
    <div className="k-hero">
      <div className="duo">
        <MagazineImage
          {...heroImage}
          track={track}
          alt={
            isPhoto
              ? t('magazine.photo.bandAlt', { name: band.name })
              : t('magazine.photo.coverAlt', { album: track.album })
          }
          isEager={leaf === 1 && !isReaderLayout}
        />
      </div>
      <span className="k-cap" aria-hidden="true">
        {isPhoto ? band.name : `${track.album}, ${String(track.year)}`}
      </span>
      <div className="k-plate">
        <span className="k-kick">
          {t('magazine.article.kicker', { origin, year: band.sinceYear })}
        </span>
        <h3 className="k-name" style={{ fontSize: getNameSize(band.name) }}>
          {band.name}
        </h3>
      </div>
    </div>
  );
}
