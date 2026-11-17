import { useState } from 'react';

import type { Track } from '@/content/schemas';
import { getCoverPlaceholder } from '@/modules/player';

type MagazineImageProps = {
  src: string | undefined;
  largeSrc: string | undefined;
  track: Track;
  alt: string;
  width: number;
  height: number;
  isEager: boolean;
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
  onLoad,
}: MagazineImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasImage = src !== undefined && src !== failedSrc;
  const hasLarge = hasImage && largeSrc !== undefined && largeSrc !== src;

  return (
    <img
      src={hasImage ? src : getCoverPlaceholder(track)}
      srcSet={hasLarge ? `${src} 1x, ${largeSrc} 2x` : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={isEager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={(event) => {
        onLoad?.(event.currentTarget.currentSrc);
      }}
      onError={() => {
        if (hasImage) setFailedSrc(src);
      }}
    />
  );
}
