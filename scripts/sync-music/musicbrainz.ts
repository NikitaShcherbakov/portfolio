import { createHash } from 'node:crypto';
import path from 'node:path';
import * as z from 'zod/mini';

import { lengthToleranceSec, paths } from './config.ts';
import { createThrottle, fetchJson } from './http.ts';
import { readJsonFile, writeJsonFile } from './json-file.ts';
import {
  normalizeArtist,
  normalizeText,
  normalizeTitle,
  stripVersionSuffix,
} from './normalize.ts';

const apiUrl = 'https://musicbrainz.org/ws/2';
const minRequestGapMs = 1100;
const pageSize = 100;
const excludedSecondaryTypes = new Set([
  'Compilation',
  'Live',
  'Soundtrack',
  'Remix',
  'DJ-mix',
  'Mixtape/Street',
  'Demo',
  'Interview',
  'Spokenword',
  'Audiobook',
]);
const fallbackTypes = new Set(['Single', 'EP']);

const artistCreditSchema = z.array(
  z.object({
    name: z.string(),
    joinphrase: z.optional(z.string()),
    artist: z.object({ id: z.string(), name: z.string() }),
  })
);

const recordingSearchSchema = z.object({
  recordings: z.array(
    z.object({
      title: z.string(),
      'artist-credit': z.optional(artistCreditSchema),
    })
  ),
});

const releaseGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  'primary-type': z.optional(z.nullable(z.string())),
  'secondary-types': z.optional(z.array(z.string())),
  'first-release-date': z.optional(z.string()),
});

const releaseGroupBrowseSchema = z.object({
  'release-groups': z.array(releaseGroupSchema),
  'release-group-count': z.int(),
});

const releaseSchema = z.object({
  id: z.string(),
  date: z.optional(z.string()),
  'cover-art-archive': z.optional(z.object({ front: z.boolean() })),
});

const releaseBrowseSchema = z.object({
  releases: z.array(releaseSchema),
  'release-count': z.int(),
});

const releaseTracksSchema = z.object({
  media: z.array(
    z.object({
      tracks: z.optional(
        z.array(
          z.object({
            title: z.string(),
            recording: z.object({
              id: z.string(),
              title: z.string(),
              length: z.optional(z.nullable(z.number())),
            }),
          })
        )
      ),
    })
  ),
});

type ArtistCredit = z.infer<typeof artistCreditSchema>;
type ReleaseGroup = z.infer<typeof releaseGroupSchema>;
type Release = z.infer<typeof releaseSchema>;

type RecordingMatch = {
  recordingId: string;
  title: string;
  artist: string;
  artistMbid: string;
  releaseGroupId: string;
  album: string;
  year?: number;
  albumsChecked: number;
};

type TrackQuery = { artist: string; title: string; durationSec: number };

const waitForRequestSlot = createThrottle(minRequestGapMs);

async function fetchMusicBrainz<T>(
  pathAndQuery: string,
  schema: z.ZodMiniType<T>
): Promise<T | null> {
  const separator = pathAndQuery.includes('?') ? '&' : '?';
  const url = `${apiUrl}${pathAndQuery}${separator}fmt=json`;
  const cacheKey = createHash('sha1').update(url).digest('hex');
  const cachePath = path.join(paths.musicBrainzCache, `${cacheKey}.json`);
  const cached = await readJsonFile(
    cachePath,
    z.object({ data: z.nullable(schema) })
  );

  if (cached) return cached.data;

  await waitForRequestSlot();

  const data = await fetchJson(url, schema);
  await writeJsonFile(cachePath, { url, data });

  return data;
}

async function fetchAllPages<Page, Item>(
  pathAndQuery: string,
  schema: z.ZodMiniType<Page>,
  readPage: (page: Page) => { items: Item[]; total: number }
): Promise<Item[]> {
  const items: Item[] = [];

  for (let offset = 0; ; offset += pageSize) {
    const page = await fetchMusicBrainz(
      `${pathAndQuery}&limit=${String(pageSize)}&offset=${String(offset)}`,
      schema
    );

    if (!page) break;

    const { items: pageItems, total } = readPage(page);

    items.push(...pageItems);

    if (offset + pageSize >= total) break;
  }

  return items;
}

function quoteLucene(value: string): string {
  return `"${value.replace(/[\\"]/g, '\\$&')}"`;
}

function getCreditName(credit: ArtistCredit): string {
  return credit
    .map(({ name, joinphrase }) => `${name}${joinphrase ?? ''}`)
    .join('');
}

function getIsArtistMatch(credit: ArtistCredit, artist: string): boolean {
  const expected = normalizeArtist(artist);
  const firstName = credit[0]?.name ?? '';

  return [getCreditName(credit), firstName].some(
    (name) => normalizeArtist(name) === expected
  );
}

function getIsLengthMatch(
  lengthMs: number | null | undefined,
  durationSec: number
): boolean {
  if (lengthMs === null || lengthMs === undefined) return true;

  return Math.abs(lengthMs / 1000 - durationSec) <= lengthToleranceSec;
}

function getYear(date: string | undefined): number | undefined {
  const year = Number(date?.slice(0, 4));

  return Number.isInteger(year) && year > 0 ? year : undefined;
}

function compareDates(
  left: string | undefined,
  right: string | undefined
): number {
  if (!left) return right ? 1 : 0;
  if (!right) return -1;

  return left.localeCompare(right);
}

async function findArtist(
  track: TrackQuery
): Promise<{ id: string; name: string } | undefined> {
  const query = `recording:${quoteLucene(stripVersionSuffix(track.title))} AND artist:${quoteLucene(track.artist)}`;
  const result = await fetchMusicBrainz(
    `/recording?query=${encodeURIComponent(query)}&limit=25`,
    recordingSearchSchema
  );
  const votes = new Map<string, { name: string; count: number }>();

  for (const recording of result?.recordings ?? []) {
    const credit = recording['artist-credit'] ?? [];
    const artistId = credit[0]?.artist.id;

    if (artistId && getIsArtistMatch(credit, track.artist)) {
      const known = votes.get(artistId);

      votes.set(artistId, {
        name: known?.name ?? getCreditName(credit),
        count: (known?.count ?? 0) + 1,
      });
    }
  }

  const [winner] = [...votes.entries()].sort(
    (left, right) => right[1].count - left[1].count
  );

  return winner ? { id: winner[0], name: winner[1].name } : undefined;
}

async function getOriginalCandidates(
  artistMbid: string
): Promise<ReleaseGroup[]> {
  const groups = await fetchAllPages(
    `/release-group?artist=${artistMbid}&type=album|ep|single`,
    releaseGroupBrowseSchema,
    (page) => ({
      items: page['release-groups'],
      total: page['release-group-count'],
    })
  );
  const byDate = (left: ReleaseGroup, right: ReleaseGroup) =>
    compareDates(left['first-release-date'], right['first-release-date']);
  const originals = groups.filter(
    (group) =>
      !(group['secondary-types'] ?? []).some((type) =>
        excludedSecondaryTypes.has(type)
      )
  );
  const albums = originals
    .filter((group) => group['primary-type'] === 'Album')
    .sort(byDate);
  const fallbacks = originals
    .filter((group) => fallbackTypes.has(group['primary-type'] ?? ''))
    .sort(byDate);

  return [...albums, ...fallbacks];
}

export async function getReleaseGroupReleases(
  releaseGroupId: string
): Promise<Release[]> {
  const releases = await fetchAllPages(
    `/release?release-group=${releaseGroupId}&status=official`,
    releaseBrowseSchema,
    (page) => ({ items: page.releases, total: page['release-count'] })
  );

  return releases.sort((left, right) => compareDates(left.date, right.date));
}

async function findTrackOnReleaseGroup(
  group: ReleaseGroup,
  track: TrackQuery
): Promise<{ id: string; title: string } | undefined> {
  const firstRelease = (await getReleaseGroupReleases(group.id))[0];

  if (!firstRelease) return undefined;

  const release = await fetchMusicBrainz(
    `/release/${firstRelease.id}?inc=recordings`,
    releaseTracksSchema
  );
  const expectedTitle = normalizeTitle(track.title);

  return release?.media
    .flatMap((medium) => medium.tracks ?? [])
    .find(
      ({ title, recording }) =>
        [title, recording.title].some(
          (name) => normalizeText(name) === expectedTitle
        ) && getIsLengthMatch(recording.length, track.durationSec)
    )?.recording;
}

export async function findRecording(
  track: TrackQuery
): Promise<RecordingMatch | null> {
  const artist = await findArtist(track);

  if (!artist) return null;

  const candidates = await getOriginalCandidates(artist.id);

  for (const [index, group] of candidates.entries()) {
    const recording = await findTrackOnReleaseGroup(group, track);

    if (!recording) continue;

    const year = getYear(group['first-release-date']);

    return {
      recordingId: recording.id,
      title: recording.title,
      artist: artist.name,
      artistMbid: artist.id,
      releaseGroupId: group.id,
      album: group.title,
      ...(year === undefined ? {} : { year }),
      albumsChecked: index + 1,
    };
  }

  return null;
}
