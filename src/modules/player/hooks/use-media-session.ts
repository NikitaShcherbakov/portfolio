import { useEffect } from 'react';

import { getTrack } from '@/content/tracks';

import { selectIsPlaybackActive, usePlayerStore } from '../stores/player-store';
import { getCoverPlaceholder } from '../utils/cover-placeholder';

const artworkDelayMs = 800;

export function useMediaSession() {
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
    const info = {
      title: track.title,
      artist: track.artist,
      album: track.album,
    };

    navigator.mediaSession.metadata = new MediaMetadata(info);

    // Chromium downloads the artwork of every new metadata and aborts it when the metadata is replaced, so
    // skipping through tracks would start and cancel a cover request per skip.
    const timer = setTimeout(() => {
      navigator.mediaSession.metadata = new MediaMetadata({
        ...info,
        artwork: [artwork],
      });
    }, artworkDelayMs);

    return () => {
      clearTimeout(timer);
    };
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
