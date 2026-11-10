import { useTranslation } from 'react-i18next';

import { CornerScrews } from './corner-screws';

type MagazineUnitProps = {
  artist: string;
};

export function MagazineUnit({ artist }: MagazineUnitProps) {
  const { t } = useTranslation();

  return (
    <div className="mag-unit-wrap">
      <div className="mag-unit">
        <CornerScrews className="mag-scr" offset={4} />
        <div className="mag-lcd" aria-hidden="true">
          <span className="mag-lcd-s">{t('player.magazine.pageUnknown')}</span>
          <span className="mag-lcd-v">{artist}</span>
          <span className="mag-glass" />
        </div>
        <button
          type="button"
          className="mag-key"
          aria-label={t('player.magazine.openLabel', { artist })}
          disabled
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
