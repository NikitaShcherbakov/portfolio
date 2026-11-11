import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { getTrack } from '@/content/tracks';

import { useMediaQuery } from '../hooks/use-media-query';
import { useReadyCover } from '../hooks/use-ready-cover';
import { selectIsPlaybackActive, usePlayerStore } from '../stores/player-store';
import { getDiscLabel } from '../utils/format';
import { CoverImage } from './cover-image';
import { MagazineUnit } from './magazine-unit';

const discSizePx = 236;
const discOnFirstScreenQuery = '(min-width: 1181px)';

export function DiscBay() {
  const { t } = useTranslation();
  const ringPathId = useId();
  const currentIndex = usePlayerStore.use.currentIndex();
  const isPlaybackActive = usePlayerStore(selectIsPlaybackActive);
  const togglePlay = usePlayerStore.use.togglePlay();
  const track = getTrack(currentIndex);
  const discCover = useReadyCover(track);
  const isDiscOnFirstScreen = useMediaQuery(discOnFirstScreenQuery);
  const discLabel = getDiscLabel(track);
  const discTrackLabel = getDiscLabel(discCover.track);

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
        <span className="disc spin-slow discA">
          <CoverImage
            track={discCover.track}
            size={discCover.size}
            isPriority={isDiscOnFirstScreen}
            sizePx={discSizePx}
            className="disc-art"
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
                {`${discTrackLabel} · `.repeat(2)}
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
