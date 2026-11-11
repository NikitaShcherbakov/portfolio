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

const coverSchema = z.object({
  source: z.enum(['release-group', 'release', 'theaudiodb', 'none']),
  coverUrl: z.optional(z.url()),
  coverThumbUrl: z.optional(z.url()),
});

type Cover = z.infer<typeof coverSchema>;

type CoverUrls = Required<Pick<Cover, 'coverUrl' | 'coverThumbUrl'>>;

const waitForAudioDbSlot = createThrottle(audioDbMinGapMs);

async function getAudioDbThumb(
  releaseGroupId: string
): Promise<string | undefined> {
  await waitForAudioDbSlot();

  const result = await fetchJson(
    `${audioDbAlbumUrl}?i=${releaseGroupId}`,
    audioDbAlbumSchema
  );

  return result?.album?.[0]?.strAlbumThumb ?? undefined;
}

async function getCoverArtFronts(base: string): Promise<CoverUrls | null> {
  const coverThumbUrl = await getRedirectTarget(`${base}/front-250`);

  if (!coverThumbUrl) return null;

  const coverUrl = await getRedirectTarget(`${base}/front-500`);

  return coverUrl ? { coverUrl, coverThumbUrl } : null;
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

async function findCover(releaseGroupId: string): Promise<Cover> {
  const groupFronts = await getCoverArtFronts(
    `${coverArtUrl}/release-group/${releaseGroupId}`
  );

  if (groupFronts) return { source: 'release-group', ...groupFronts };

  const releaseFronts = await getReleaseFronts(releaseGroupId);

  if (releaseFronts) return { source: 'release', ...releaseFronts };

  const thumb = await getAudioDbThumb(releaseGroupId);

  if (thumb) {
    return {
      source: 'theaudiodb',
      coverUrl: `${thumb}/medium`,
      coverThumbUrl: `${thumb}/small`,
    };
  }

  return { source: 'none' };
}

export async function getCover(releaseGroupId: string): Promise<Cover> {
  const cachePath = path.join(paths.coversCache, `${releaseGroupId}.json`);
  const cached = await readJsonFile(cachePath, coverSchema);

  if (cached) return cached;

  const cover = await findCover(releaseGroupId);
  await writeJsonFile(cachePath, cover);

  return cover;
}
