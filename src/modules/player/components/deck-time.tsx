import { useTranslation } from 'react-i18next';

import { getTrack } from '@/content/tracks';

import { usePlayerStore } from '../stores/player-store';
import { formatDuration, formatElapsed } from '../utils/format';

const ghostDigits = '88:88';

export function DeckTime() {
  const { t } = useTranslation();
  const currentIndex = usePlayerStore.use.currentIndex();
  const elapsed = usePlayerStore.use.elapsed();
  const { durationSec } = getTrack(currentIndex);

  return (
    <div className="hp-group hp-group-time">
      <div className="v2-bezel" aria-hidden="true">
        <div className="v2-amber">
          <span className="v2-ghost">{ghostDigits}</span>
          <span className="v2-big">{formatElapsed(elapsed)}</span>
          <span className="v2-small">/ {formatDuration(durationSec)}</span>
          <span className="v2-dots" />
          <span className="v2-glass" />
        </div>
      </div>
      <div className="vol-lbl" aria-hidden="true">
        <span className="vol-lbl-a">{t('player.engraving.time')}</span>
        <span className="vol-lbl-b">{t('player.engraving.elapsedTotal')}</span>
      </div>
    </div>
  );
}
