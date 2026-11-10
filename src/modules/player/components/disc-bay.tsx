import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { getTrack } from '@/content/tracks';
import { cn } from '@/lib/utils';

import { selectIsPlaybackActive, usePlayerStore } from '../stores/player-store';
import { getCoverPlaceholder } from '../utils/cover-placeholder';
import { MagazineUnit } from './magazine-unit';

const discSizePx = 236;

export function DiscBay() {
  const { t } = useTranslation();
  const ringPathId = useId();
  const currentIndex = usePlayerStore.use.currentIndex();
  const isPlaybackActive = usePlayerStore(selectIsPlaybackActive);
  const togglePlay = usePlayerStore.use.togglePlay();
  const track = getTrack(currentIndex);
  const discLabel = `${track.artist} · ${track.album} · ${String(track.year)}`;
  const isOddTrack = currentIndex % 2 === 1;

  return (
    <div className="bay disc-bay">
      <button type="button" className="disc-well" onClick={togglePlay}>
        <span className="player-sr-only">
          {t('player.controls.disc', {
            label: discLabel,
            action: isPlaybackActive
              ? t('player.controls.pause')
              : t('player.controls.play'),
          })}
        </span>
        <span
          key={track.id}
          className={cn('disc spin-slow', isOddTrack ? 'discA' : 'discB')}
        >
          <img
            src={getCoverPlaceholder(track)}
            alt=""
            width={discSizePx}
            height={discSizePx}
            className="disc-art"
            loading="lazy"
          />
          <span className="disc-rainbow" />
          <span className="disc-grooves" />
          <svg
            className="disc-ring-text"
            viewBox="0 0 200 200"
            aria-hidden="true"
          >
            <defs>
              <path
                id={ringPathId}
                d="M100,100 m-88,0 a88,88 0 1,1 176,0 a88,88 0 1,1 -176,0"
              />
            </defs>
            <text>
              <textPath href={`#${ringPathId}`}>
                {`${discLabel} · `.repeat(2)}
              </textPath>
            </text>
          </svg>
          <span className="disc-hub" />
        </span>
        <span className="disc-sheen" aria-hidden="true" />
        <span className="disc-clamp" aria-hidden="true" />
      </button>
      <div className="disc-info">
        <span className="disc-label">{t('player.deck.nowSpinning')}</span>
        <MagazineUnit artist={track.artist} />
      </div>
    </div>
  );
}
