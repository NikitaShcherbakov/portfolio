import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { getTrack } from '@/content/tracks';

import { useSeekDrag } from '../hooks/use-seek-drag';
import { seekStepSec, usePlayerStore } from '../stores/player-store';
import {
  formatDuration,
  formatElapsed,
  getProgressPercent,
} from '../utils/format';

export function DeckSeekBar() {
  const { t } = useTranslation();
  const currentIndex = usePlayerStore.use.currentIndex();
  const elapsed = usePlayerStore.use.elapsed();
  const seekBy = usePlayerStore.use.seekBy();
  const seekTo = usePlayerStore.use.seekTo();
  const handlePointerDown = useSeekDrag();
  const { durationSec } = getTrack(currentIndex);
  const progressPercent = `${String(getProgressPercent(elapsed, durationSec))}%`;

  const keyActions: Record<string, (() => void) | undefined> = {
    ArrowRight: () => {
      seekBy(seekStepSec);
    },
    ArrowUp: () => {
      seekBy(seekStepSec);
    },
    Enter: () => {
      seekBy(seekStepSec);
    },
    ' ': () => {
      seekBy(seekStepSec);
    },
    ArrowLeft: () => {
      seekBy(-seekStepSec);
    },
    ArrowDown: () => {
      seekBy(-seekStepSec);
    },
    Home: () => {
      seekTo(0);
    },
    End: () => {
      seekTo(durationSec);
    },
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const action = keyActions[event.key];

    if (action) {
      event.preventDefault();
      action();
    }
  };

  return (
    <div
      role="slider"
      tabIndex={0}
      className="hp-seek"
      aria-label={t('player.controls.seek')}
      aria-valuemin={0}
      aria-valuemax={durationSec}
      aria-valuenow={elapsed}
      aria-valuetext={t('player.controls.seekValue', {
        elapsed: formatElapsed(elapsed),
        length: formatDuration(durationSec),
      })}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
    >
      <span className="hp-bar-track">
        <span className="hp-bar-fill" style={{ width: progressPercent }} />
        <span className="hp-bar-head" style={{ left: progressPercent }} />
      </span>
    </div>
  );
}
