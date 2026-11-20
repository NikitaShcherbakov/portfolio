import { useTranslation } from 'react-i18next';

export function DeckJacks() {
  const { t } = useTranslation();

  return (
    <div className="hp-jacks" aria-hidden="true">
      <span className="jk-l">
        <span className="hp-orange-led" />
        <span className="hp-mini">{t('player.deck.lineOut')}</span>
        <span className="z-lr">
          <span className="z-rca z-w" />
          {t('player.deck.left')}
        </span>
        <span className="z-lr">
          <span className="z-rca z-r" />
          {t('player.deck.right')}
        </span>
      </span>
      <span className="hp-serial">{t('player.deck.serial')}</span>
      <span className="jk-r">
        <span className="hp-mini">{t('player.deck.phones')}</span>
        <span className="hp-rca" />
      </span>
    </div>
  );
}
