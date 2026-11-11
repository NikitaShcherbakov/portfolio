import { useEffect } from 'react';

import { getTrack } from '@/content/tracks';

import { selectIsPlaybackActive, usePlayerStore } from '../stores/player-store';
import { getAudioElement } from '../utils/audio-element';
import { getCoverPlaceholder } from '../utils/cover-placeholder';

function useAudioEvents() {
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
    const options = { signal: listeners.signal };

    element.addEventListener(
      'timeupdate',
      () => {
        handleTimeUpdate(element.currentTime);
      },
      options
    );
    element.addEventListener(
      'waiting',
      () => {
        handleBuffering(true);
      },
      options
    );
    element.addEventListener('playing', handlePlaying, options);
    element.addEventListener('play', handleExternalPlay, options);
    element.addEventListener(
      'pause',
      () => {
        handleExternalPause(element.ended);
      },
      options
    );
    element.addEventListener('ended', handleEnded, options);
    element.addEventListener(
      'error',
      () => {
        handleError(element.error?.code);
      },
      options
    );

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

function useMediaSession() {
  const currentIndex = usePlayerStore.use.currentIndex();
  const play = usePlayerStore.use.play();
  const pause = usePlayerStore.use.pause();
  const playNext = usePlayerStore.use.playNext();
  const playPrevious = usePlayerStore.use.playPrevious();
  const seekTo = usePlayerStore.use.seekTo();
  const isPlaybackActive = usePlayerStore(selectIsPlaybackActive);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.playbackState = isPlaybackActive
      ? 'playing'
      : 'paused';
  }, [isPlaybackActive]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const track = getTrack(currentIndex);
    const artwork = track.coverUrl
      ? { src: track.coverUrl, sizes: '500x500' }
      : { src: getCoverPlaceholder(track) };

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: [artwork],
    });
  }, [currentIndex]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const { mediaSession } = navigator;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', play],
      ['pause', pause],
      ['nexttrack', playNext],
      ['previoustrack', playPrevious],
      [
        'seekto',
        (details) => {
          if (details.seekTime !== undefined) seekTo(details.seekTime);
        },
      ],
    ];

    for (const [action, handler] of handlers) {
      mediaSession.setActionHandler(action, handler);
    }

    return () => {
      for (const [action] of handlers) {
        mediaSession.setActionHandler(action, null);
      }
    };
  }, [pause, play, playNext, playPrevious, seekTo]);
}

export function useAudioPlayer() {
  useAudioEvents();
  useMediaSession();
}
