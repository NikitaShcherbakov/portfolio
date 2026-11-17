import { type CSSProperties, memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { coverSizePx } from '../utils/image-sizes';
import type { MagazineEntry } from '../utils/magazine-entries';
import { MagazineImage } from './magazine-image';

type CoverPageProps = {
  entry: MagazineEntry;
  number: string;
};

export const CoverPage = memo(function CoverPage({
  entry: { track, leaf },
  number,
}: CoverPageProps) {
  const { t } = useTranslation();
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const coverStyle: CSSProperties & { '--art': string } = {
    '--art': loadedSrc === null ? 'none' : `url("${loadedSrc}")`,
  };

  return (
    <>
      <div className="j-cover duo" style={coverStyle}>
        <MagazineImage
          src={track.coverUrl}
          largeSrc={track.coverLargeUrl}
          track={track}
          alt={t('magazine.cover.alt', { album: track.album })}
          width={coverSizePx}
          height={coverSizePx}
          isEager={leaf === 1}
          onLoad={setLoadedSrc}
        />
      </div>
      <span className="j-cv-fol" aria-hidden="true">
        {number}
      </span>
      <span className="j-cv-cred" aria-hidden="true">
        {t('magazine.cover.credit', {
          album: track.album,
          year: track.year,
        })}
      </span>
    </>
  );
});
