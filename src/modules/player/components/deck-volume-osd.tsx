import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useTransientFlag } from '../hooks/use-transient-flag';
import { usePlayerStore } from '../stores/player-store';
import { getProgressPercent } from '../utils/format';
import { maxVolume } from '../utils/volume-knob';

const osdDurationMs = 1500;

export function DeckVolumeOsd() {
  const { t } = useTranslation();
  const [isVisible, show] = useTransientFlag(osdDurationMs);
  const volume = usePlayerStore.use.volume();
  const isMuted = usePlayerStore.use.isMuted();
  const levelPercent = isMuted ? 0 : getProgressPercent(volume, maxVolume);

  useEffect(
    () =>
      usePlayerStore.subscribe((state, previousState) => {
        if (state.volumeChangeCount !== previousState.volumeChangeCount) {
          show();
        }
      }),
    [show]
  );

  if (!isVisible) {
    return null;
  }

  return (
    <div className="hp-osd" aria-hidden="true">
      {isMuted ? t('player.osd.mute') : t('player.osd.volume', { volume })}
      <span className="hp-osd-bar">
        <span style={{ width: `${String(levelPercent)}%` }} />
      </span>
    </div>
  );
}
