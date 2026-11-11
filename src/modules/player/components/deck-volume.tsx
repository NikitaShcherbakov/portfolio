import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { usePlayerStore } from '../stores/player-store';
import { dialTicks, getKnobAngle, maxVolume } from '../utils/volume-knob';
import { MinusIcon, PlusIcon } from './deck-icons';

export function DeckVolume() {
  const { t } = useTranslation();
  const volume = usePlayerStore.use.volume();
  const isMuted = usePlayerStore.use.isMuted();
  const increaseVolume = usePlayerStore.use.increaseVolume();
  const decreaseVolume = usePlayerStore.use.decreaseVolume();
  const toggleMute = usePlayerStore.use.toggleMute();

  return (
    <div className="hp-group">
      <div
        className="hp-vol"
        role="group"
        aria-label={t('player.controls.volume')}
      >
        <button
          type="button"
          className="hp-vbtn"
          aria-label={t('player.controls.volumeDown')}
          onClick={decreaseVolume}
        >
          <MinusIcon />
        </button>
        <span className="vol-dial">
          <span className="vol-print" aria-hidden="true">
            {dialTicks.map(({ level, style }) => (
              <span key={level} className="vol-tick" style={style} />
            ))}
          </span>
          <button
            type="button"
            className={cn('hp-knob', isMuted && 'muted')}
            aria-label={
              isMuted
                ? t('player.controls.volumeKnobMuted')
                : t('player.controls.volumeKnob', { volume, max: maxVolume })
            }
            aria-pressed={isMuted}
            onClick={toggleMute}
          >
            <span
              className="hp-knob-cap"
              style={{
                transform: `rotate(${String(getKnobAngle(volume))}deg)`,
              }}
            >
              <span className="hp-knob-mark" />
            </span>
          </button>
        </span>
        <button
          type="button"
          className="hp-vbtn"
          aria-label={t('player.controls.volumeUp')}
          onClick={increaseVolume}
        >
          <PlusIcon />
        </button>
      </div>
      <div className="vol-lbl" aria-hidden="true">
        <span className="vol-lbl-a">{t('player.engraving.volume')}</span>
        <span className="vol-lbl-b">{t('player.engraving.pushToMute')}</span>
      </div>
    </div>
  );
}
