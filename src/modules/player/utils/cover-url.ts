import type { Track } from '@/content/schemas';

export type CoverSize = 'small' | 'large';

export function getCoverUrl(
  track: Pick<Track, 'coverUrl' | 'coverThumbUrl'>,
  size: CoverSize
): string | undefined {
  return size === 'small' ? track.coverThumbUrl : track.coverUrl;
}
