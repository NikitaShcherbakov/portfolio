import { useTranslation } from 'react-i18next';

export function DeckHeader() {
  const { t } = useTranslation();

  return (
    <div className="deck-top">
      <span className="deck-brand">{t('player.deck.brand')}</span>
      <span className="deck-vents deck-perf" aria-hidden="true" />
      <span className="deck-modelplate">
        <span className="deck-model-a">{t('player.deck.model')}</span>
        <span className="deck-model-b">{t('player.deck.tagline')}</span>
      </span>
      <span className="deck-ir" aria-hidden="true" />
    </div>
  );
}
