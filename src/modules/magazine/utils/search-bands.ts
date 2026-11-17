import { normalizeSearchText } from '@/utils/normalize-search-text';

import { magazineEntries, type MagazineEntry } from './magazine-entries';

const maxResults = 6;

const searchableEntries = magazineEntries.map((entry) => ({
  entry,
  text: normalizeSearchText(
    [entry.band.name, entry.track.title, entry.track.album].join(' ')
  ),
}));

export function searchBands(query: string): MagazineEntry[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) return [];

  return searchableEntries
    .filter(({ text }) => text.includes(normalizedQuery))
    .slice(0, maxResults)
    .map(({ entry }) => entry);
}
