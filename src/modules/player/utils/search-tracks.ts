import type { Track } from '@/content/schemas';

function normalizeSearchText(text: string) {
  return text.trim().toLowerCase();
}

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
