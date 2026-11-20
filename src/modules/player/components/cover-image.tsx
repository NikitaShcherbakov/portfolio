import { useState } from 'react';

import type { Track } from '@/content/schemas';

import { getCoverPlaceholder } from '../utils/cover-placeholder';
import { type CoverSize, getCoverUrl } from '../utils/cover-url';

type CoverImageProps = {
  track: Track;
  size: CoverSize;
  sizePx: number;
  className: string;
};

export function CoverImage({
  track,
  size,
  sizePx,
  className,
}: CoverImageProps) {
  const coverUrl = getCoverUrl(track, size);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const hasCover = coverUrl !== undefined && coverUrl !== failedUrl;

  return (
    <img
      src={hasCover ? coverUrl : getCoverPlaceholder(track)}
      alt=""
      width={sizePx}
      height={sizePx}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => {
        if (hasCover) setFailedUrl(coverUrl);
      }}
    />
  );
}
