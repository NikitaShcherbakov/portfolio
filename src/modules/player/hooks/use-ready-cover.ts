import { useEffect, useState } from 'react';

import type { Track } from '@/content/schemas';

import { getIsCoverReady, preloadCover } from '../utils/cover-preload';
import type { CoverSize } from '../utils/cover-url';

type ReadyCover = { track: Track; size: CoverSize };

function getReadyCover(track: Track): ReadyCover | null {
  if (getIsCoverReady(track.coverUrl)) return { track, size: 'large' };
  if (getIsCoverReady(track.coverThumbUrl)) return { track, size: 'small' };

  return null;
}

export function useReadyCover(track: Track): ReadyCover {
  const [shownCover, setShownCover] = useState<ReadyCover>(
    () => getReadyCover(track) ?? { track, size: 'large' }
  );
  const isLargeShown =
    shownCover.track === track && shownCover.size === 'large';
  const cover = (isLargeShown ? null : getReadyCover(track)) ?? shownCover;

  useEffect(() => {
    const controller = new AbortController();
    const show = (size: ReadyCover['size']) => {
      if (!controller.signal.aborted) setShownCover({ track, size });
    };

    void (async () => {
      const large = preloadCover(track.coverUrl);

      if (!getIsCoverReady(track.coverUrl)) {
        await Promise.race([large, preloadCover(track.coverThumbUrl)]);

        if (!getIsCoverReady(track.coverUrl)) show('small');
      }

      await large;
      show('large');
    })();

    return () => {
      controller.abort();
    };
  }, [track]);

  return cover;
}
