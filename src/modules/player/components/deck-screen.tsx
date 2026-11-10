import { useTranslation } from 'react-i18next';

import { getTrack, tracks } from '@/content/tracks';
import { cn } from '@/lib/utils';

import { getQueueState, usePlayerStore } from '../stores/player-store';
import { padTrackNumber } from '../utils/format';
import { getAutoNextIndex, repeatModes } from '../utils/queue';
import { DeckSeekBar } from './deck-seek-bar';
import { DeckVolumeOsd } from './deck-volume-osd';

const spectrumDelays = [
  '-0.00s',
  '-0.14s',
  '-0.27s',
  '-0.41s',
  '-0.55s',
  '-0.69s',
  '-0.82s',
  '-0.06s',
  '-0.20s',
  '-0.33s',
  '-0.47s',
  '-0.61s',
  '-0.74s',
  '-0.88s',
  '-0.12s',
  '-0.26s',
  '-0.39s',
  '-0.53s',
  '-0.67s',
  '-0.80s',
  '-0.04s',
  '-0.18s',
  '-0.31s',
  '-0.45s',
  '-0.59s',
  '-0.73s',
  '-0.86s',
  '-0.10s',
  '-0.24s',
  '-0.37s',
  '-0.51s',
  '-0.65s',
];

export function DeckScreen() {
  const { t } = useTranslation();
  const upNextIndex = usePlayerStore((state) =>
    getAutoNextIndex(getQueueState(state))
  );
  const currentIndex = usePlayerStore.use.currentIndex();
  const isPlaying = usePlayerStore.use.isPlaying();
  const isPowerOn = usePlayerStore.use.isPowerOn();
  const isShuffle = usePlayerStore.use.isShuffle();
  const repeatMode = usePlayerStore.use.repeatMode();
  const track = getTrack(currentIndex);

  const getStatus = () => {
    if (!isPowerOn) {
      return t('player.status.standby');
    }

    return isPlaying ? t('player.status.playing') : t('player.status.paused');
  };

  const getUpNextLabel = () => {
    if (upNextIndex === null) {
      return t('player.upNext.end');
    }

    if (upNextIndex === currentIndex) {
      return t('player.upNext.repeat', { title: track.title });
    }

    const upNextTrack = getTrack(upNextIndex);

    return t('player.upNext.track', {
      artist: upNextTrack.artist,
      title: upNextTrack.title,
    });
  };

  return (
    <div className="hp-bezel">
      <div className="hp-bezel-top">
        <span className="hp-hello">{t('player.deck.hello')}</span>
        <span className="hp-disc-ind">
          <span className="hp-amber" aria-hidden="true" />
          {t('player.deck.disc')}
        </span>
      </div>
      <div className="hp-screen">
        <div className="hp-on" inert={!isPowerOn}>
          <div className="hp-row">
            <span className="hp-status">{getStatus()}</span>
            <span className="hp-dim">·</span>
            <span className="hp-track">
              {t('player.trackNumber', {
                current: padTrackNumber(currentIndex + 1, tracks.length),
                total: tracks.length,
              })}
            </span>
            <span className="hp-spacer" />
            <span className="hp-flags">
              <span className={cn('hp-flag', isShuffle && 'on')}>
                {t('player.deck.shuffleFlag')}
              </span>
              <span
                className={cn(
                  'hp-flag',
                  repeatMode !== repeatModes.Off && 'on'
                )}
              >
                {t(`player.repeatFlag.${repeatMode}`)}
              </span>
            </span>
          </div>
          <div className="hp-now" aria-live="polite">
            <div className="hp-title">{track.title}</div>
            <div className="hp-meta">
              <span className="hp-artist">{track.artist}</span>
              <span className="hp-dim">·</span>
              <span>{track.album}</span>
              <span className="hp-dim">·</span>
              <span>{track.year}</span>
            </div>
          </div>
          <DeckSeekBar />
          <div className="hp-next">
            <span className="hp-next-k">{t('player.deck.nextKey')}</span>
            <span className="hp-next-v">{getUpNextLabel()}</span>
          </div>
          <div className="hp-bottom">
            <span className="hp-spectrum" aria-hidden="true">
              {spectrumDelays.map((delay) => (
                <span
                  key={delay}
                  className="hp-seg"
                  style={{ animationDelay: delay }}
                />
              ))}
            </span>
          </div>
        </div>
        <div className="hp-standby" aria-hidden="true">
          {t('player.deck.standby')}
        </div>
        <DeckVolumeOsd />
        <span className="hp-glass" aria-hidden="true" />
      </div>
      <div className="hp-caption" style={{ alignItems: 'center' }}>
        <span className="hp-led" aria-hidden="true" />
        <span className="z-capt" aria-hidden="true">
          {t('player.deck.captionMain')}
          <span className="z-capt-x">{t('player.deck.captionTail')}</span>
        </span>
        <span className="hp-led" aria-hidden="true" />
      </div>
    </div>
  );
}
