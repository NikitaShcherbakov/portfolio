import { useTranslation } from 'react-i18next';

import { useMagazineLink } from '@/modules/magazine';

import { CornerScrews } from './corner-screws';

type MagazineUnitProps = {
  artist: string;
  trackIndex: number;
};

export function MagazineUnit({ artist, trackIndex }: MagazineUnitProps) {
  const { t } = useTranslation();
  const { page, openInMagazine } = useMagazineLink(trackIndex);

  return (
    <div className="mag-unit-wrap">
      <div className="mag-unit">
        <CornerScrews className="mag-scr" offset={4} />
        <div className="mag-lcd" aria-hidden="true">
          <span className="mag-lcd-s">
            {page === null
              ? t('player.magazine.pageUnknown')
              : t('player.magazine.page', { page })}
          </span>
          <span className="mag-lcd-v">{artist}</span>
          <span className="mag-glass" />
        </div>
        <button
          type="button"
          className="mag-key"
          aria-label={
            page === null
              ? t('player.magazine.notInMagazine', { artist })
              : t('player.magazine.openLabel', { artist, page })
          }
          disabled={page === null}
          onClick={openInMagazine}
        >
          <span className="mag-ej" aria-hidden="true" />
        </button>
      </div>
      <div className="mag-labels" aria-hidden="true">
        <span className="mag-eng">{t('player.magazine.pageCaption')}</span>
        <span className="mag-eng">{t('player.magazine.open')}</span>
      </div>
    </div>
  );
}
