import path from 'node:path';
import * as z from 'zod/mini';

import { paths } from './config.ts';
import { createThrottle, fetchJson, getRedirectTarget } from './http.ts';
import { readJsonFile, writeJsonFile } from './json-file.ts';
import { getReleaseGroupReleases } from './musicbrainz.ts';

const coverArtUrl = 'https://coverartarchive.org';
const audioDbAlbumUrl =
  'https://www.theaudiodb.com/api/v1/json/123/album-mb.php';
const audioDbMinGapMs = 2100;

const audioDbAlbumSchema = z.object({
  album: z.nullable(
    z.array(z.object({ strAlbumThumb: z.nullable(z.string()) }))
  ),
});

const coverUrlsSchema = z.object({
  coverUrl: z.url(),
  coverThumbUrl: z.url(),
  coverLargeUrl: z.url(),
});

const cachedCoverSchema = z.discriminatedUnion('source', [
  z.extend(coverUrlsSchema, {
    source: z.enum(['release-group', 'release', 'theaudiodb']),
  }),
  z.object({ source: z.literal('none') }),
]);

type CoverUrls = z.infer<typeof coverUrlsSchema>;

type CachedCover = z.infer<typeof cachedCoverSchema>;

const waitForAudioDbSlot = createThrottle(audioDbMinGapMs);

async function getCoverArtFronts(base: string): Promise<CoverUrls | null> {
  const coverThumbUrl = await getRedirectTarget(`${base}/front-250`);

  if (!coverThumbUrl) return null;

  const coverUrl = await getRedirectTarget(`${base}/front-500`);

  if (!coverUrl) return null;

  const coverLargeUrl =
    (await getRedirectTarget(`${base}/front-1200`)) ?? coverUrl;

  return { coverUrl, coverThumbUrl, coverLargeUrl };
}

async function getReleaseFronts(
  releaseGroupId: string
): Promise<CoverUrls | null> {
  const releases = await getReleaseGroupReleases(releaseGroupId);
  const withFront = releases.find(
    (release) => release['cover-art-archive']?.front
  );

  return withFront
    ? getCoverArtFronts(`${coverArtUrl}/release/${withFront.id}`)
    : null;
}

async function getAudioDbFronts(
  releaseGroupId: string
): Promise<CoverUrls | null> {
  await waitForAudioDbSlot();

  const result = await fetchJson(
    `${audioDbAlbumUrl}?i=${releaseGroupId}`,
    audioDbAlbumSchema
  );
  const thumb = result?.album?.[0]?.strAlbumThumb;

  return thumb
    ? {
        coverUrl: `${thumb}/medium`,
        coverThumbUrl: `${thumb}/small`,
        coverLargeUrl: thumb,
      }
    : null;
}

async function findCover(releaseGroupId: string): Promise<CachedCover> {
  const groupFronts = await getCoverArtFronts(
    `${coverArtUrl}/release-group/${releaseGroupId}`
  );

  if (groupFronts) return { source: 'release-group', ...groupFronts };

  const releaseFronts = await getReleaseFronts(releaseGroupId);

  if (releaseFronts) return { source: 'release', ...releaseFronts };

  const audioDbFronts = await getAudioDbFronts(releaseGroupId);

  if (audioDbFronts) return { source: 'theaudiodb', ...audioDbFronts };

  return { source: 'none' };
}

async function getCachedCover(releaseGroupId: string): Promise<CachedCover> {
  const cachePath = path.join(paths.coversCache, `${releaseGroupId}.json`);
  const cached = await readJsonFile(cachePath, cachedCoverSchema);

  if (cached) return cached;

  const cover = await findCover(releaseGroupId);
  await writeJsonFile(cachePath, cover);

  return cover;
}

export async function getCover(
  releaseGroupId: string
): Promise<CoverUrls | undefined> {
  const cover = await getCachedCover(releaseGroupId);

  if (cover.source === 'none') return undefined;

  const { coverUrl, coverThumbUrl, coverLargeUrl } = cover;

  return { coverUrl, coverThumbUrl, coverLargeUrl };
}
