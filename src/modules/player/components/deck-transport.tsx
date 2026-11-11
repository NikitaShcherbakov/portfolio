import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { selectIsPlaybackActive, usePlayerStore } from '../stores/player-store';
import { repeatModes } from '../utils/queue';
import {
  NextIcon,
  PlayPauseIcon,
  PowerIcon,
  PreviousIcon,
  RandomIcon,
  RepeatIcon,
  ShuffleIcon,
} from './deck-icons';

type TransportButton = {
  engraving:
    'power' | 'prev' | 'play' | 'next' | 'shuffle' | 'repeat' | 'random';
  className: string;
  label: string;
  isPressed?: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function DeckTransport() {
  const { t } = useTranslation();
  const isPlaybackActive = usePlayerStore(selectIsPlaybackActive);
  const isPowerOn = usePlayerStore.use.isPowerOn();
  const isShuffle = usePlayerStore.use.isShuffle();
  const repeatMode = usePlayerStore.use.repeatMode();
  const togglePower = usePlayerStore.use.togglePower();
  const playPrevious = usePlayerStore.use.playPrevious();
  const togglePlay = usePlayerStore.use.togglePlay();
  const playNext = usePlayerStore.use.playNext();
  const toggleShuffle = usePlayerStore.use.toggleShuffle();
  const cycleRepeat = usePlayerStore.use.cycleRepeat();
  const playRandom = usePlayerStore.use.playRandom();
  const isRepeatOn = repeatMode !== repeatModes.Off;

  const buttons: TransportButton[] = [
    {
      engraving: 'power',
      className: 'hp-power',
      label: t('player.controls.power'),
      isPressed: isPowerOn,
      onClick: togglePower,
      children: (
        <>
          <span className="hp-power-led" aria-hidden="true" />
          <PowerIcon />
        </>
      ),
    },
    {
      engraving: 'prev',
      className: 'hp-round',
      label: t('player.controls.previous'),
      onClick: playPrevious,
      children: <PreviousIcon />,
    },
    {
      engraving: 'play',
      className: 'hp-round hp-orange',
      label: isPlaybackActive
        ? t('player.controls.pause')
        : t('player.controls.play'),
      onClick: togglePlay,
      children: <PlayPauseIcon />,
    },
    {
      engraving: 'next',
      className: 'hp-round',
      label: t('player.controls.next'),
      onClick: playNext,
      children: <NextIcon />,
    },
    {
      engraving: 'shuffle',
      className: cn('hp-mode', isShuffle && 'on'),
      label: t('player.controls.shuffle'),
      isPressed: isShuffle,
      onClick: toggleShuffle,
      children: (
        <>
          <span className="hp-mode-led" aria-hidden="true" />
          <ShuffleIcon />
        </>
      ),
    },
    {
      engraving: 'repeat',
      className: cn('hp-mode', isRepeatOn && 'on'),
      label: t(`player.controls.repeat.${repeatMode}`),
      onClick: cycleRepeat,
      children: (
        <>
          <span className="hp-mode-led" aria-hidden="true" />
          <RepeatIcon />
          <span className="hp-mode-one">
            {repeatMode === repeatModes.One ? '1' : ''}
          </span>
        </>
      ),
    },
    {
      engraving: 'random',
      className: 'hp-mode',
      label: t('player.controls.random'),
      onClick: playRandom,
      children: <RandomIcon />,
    },
  ];

  return (
    <div className="hp-group hp-group-tr">
      <div
        className="hp-strip"
        role="group"
        aria-label={t('player.controls.transport')}
      >
        {buttons.map(
          ({ engraving, className, label, isPressed, onClick, children }) => (
            <span key={engraving} className="hp-cell">
              <button
                type="button"
                className={className}
                aria-label={label}
                aria-pressed={isPressed}
                onClick={onClick}
              >
                {children}
              </button>
            </span>
          )
        )}
      </div>
      <div className="hp-engrave hp-engrave-t" aria-hidden="true">
        {buttons.map(({ engraving }) => (
          <span key={engraving}>{t(`player.engraving.${engraving}`)}</span>
        ))}
      </div>
    </div>
  );
}
