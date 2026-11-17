import type { Track } from '@/content/schemas';
import { normalizeSearchText } from '@/utils/normalize-search-text';

export function getTrackSearchText(track: Track) {
  return normalizeSearchText(
    [track.title, track.artist, track.album, String(track.year)].join(' ')
  );
}

export function getMatchingIndices(
  searchTexts: readonly string[],
  query: string
) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return searchTexts.map((_, index) => index);
  }

  return searchTexts.flatMap((text, index) =>
    text.includes(normalizedQuery) ? [index] : []
  );
}
