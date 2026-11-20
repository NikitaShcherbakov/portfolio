import { useAudioEvents } from './use-audio-events';
import { useMediaSession } from './use-media-session';
import { useNextTrackPreload } from './use-next-track-preload';

export function useAudioPlayer() {
  useAudioEvents();
  useMediaSession();
  useNextTrackPreload();
}
