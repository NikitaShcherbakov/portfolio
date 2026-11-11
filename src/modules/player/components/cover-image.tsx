import { useState } from 'react';

import type { Track } from '@/content/schemas';

import { getCoverPlaceholder } from '../utils/cover-placeholder';
import { type CoverSize, getCoverUrl } from '../utils/cover-url';

type CoverImageProps = {
  track: Track;
  size: CoverSize;
  sizePx: number;
  className: string;
  isPriority?: boolean;
};

export function CoverImage({
  track,
  size,
  sizePx,
  className,
  isPriority = false,
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
      loading={isPriority ? 'eager' : 'lazy'}
      fetchPriority={isPriority ? 'high' : 'auto'}
      decoding={isPriority ? 'sync' : 'async'}
      className={className}
      onError={() => {
        if (hasCover) setFailedUrl(coverUrl);
      }}
    />
  );
}
