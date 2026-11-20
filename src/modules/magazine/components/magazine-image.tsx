import { useState } from 'react';

import type { Track } from '@/content/schemas';
import { getCoverPlaceholder } from '@/modules/player';

import { magazineImageSizes } from '../utils/image-sizes';

type MagazineImageProps = {
  src: string | undefined;
  largeSrc: string | undefined;
  track: Track;
  alt: string;
  width: number;
  height: number;
  isEager: boolean;
  isPriority?: boolean;
  onLoad?: (loadedSrc: string) => void;
};

export function MagazineImage({
  src,
  largeSrc,
  track,
  alt,
  width,
  height,
  isEager,
  isPriority,
  onLoad,
}: MagazineImageProps) {
  const [failedSrcs, setFailedSrcs] = useState<readonly string[]>([]);
  const hasImage = src !== undefined && !failedSrcs.includes(src);
  const hasLarge =
    hasImage &&
    largeSrc !== undefined &&
    largeSrc !== src &&
    !failedSrcs.includes(largeSrc);

  return (
    <img
      src={hasImage ? src : getCoverPlaceholder(track)}
      srcSet={
        hasLarge
          ? `${src} ${String(width)}w, ${largeSrc} ${String(width * 2)}w`
          : undefined
      }
      sizes={hasLarge ? magazineImageSizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={isEager ? 'eager' : 'lazy'}
      fetchPriority={isPriority ? 'high' : undefined}
      decoding="async"
      onLoad={(event) => {
        onLoad?.(event.currentTarget.currentSrc);
      }}
      onError={(event) => {
        const failedSrc = event.currentTarget.currentSrc;

        if (hasImage) setFailedSrcs((srcs) => [...srcs, failedSrc]);
      }}
    />
  );
}
