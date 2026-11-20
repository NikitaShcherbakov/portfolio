import { useEffect } from 'react';

import { usePlayerStore } from '../stores/player-store';
import { getAudioElement } from '../utils/audio-element';

export function useAudioEvents() {
  const handleTimeUpdate = usePlayerStore.use.handleTimeUpdate();
  const handleBuffering = usePlayerStore.use.handleBuffering();
  const handlePlaying = usePlayerStore.use.handlePlaying();
  const handleEnded = usePlayerStore.use.handleEnded();
  const handleError = usePlayerStore.use.handleError();
  const handleExternalPlay = usePlayerStore.use.handleExternalPlay();
  const handleExternalPause = usePlayerStore.use.handleExternalPause();

  useEffect(() => {
    const element = getAudioElement();
    const listeners = new AbortController();
    const handlers: [keyof HTMLMediaElementEventMap, () => void][] = [
      [
        'timeupdate',
        () => {
          handleTimeUpdate(element.currentTime);
        },
      ],
      [
        'waiting',
        () => {
          handleBuffering(true);
        },
      ],
      ['playing', handlePlaying],
      ['play', handleExternalPlay],
      [
        'pause',
        () => {
          handleExternalPause(element.ended);
        },
      ],
      ['ended', handleEnded],
      [
        'error',
        () => {
          handleError(element.error?.code);
        },
      ],
    ];

    for (const [type, handler] of handlers) {
      element.addEventListener(type, handler, { signal: listeners.signal });
    }

    return () => {
      listeners.abort();
    };
  }, [
    handleBuffering,
    handleEnded,
    handleError,
    handleExternalPause,
    handleExternalPlay,
    handlePlaying,
    handleTimeUpdate,
  ]);
}
