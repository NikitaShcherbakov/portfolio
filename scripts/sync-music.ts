import { rm } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import { type Track, tracksSchema } from '../src/content/schemas.ts';
import { audioBaseUrl, paths } from './sync-music/config.ts';
import { getCover } from './sync-music/covers.ts';
import { type LocalTrack, readLocalTracks } from './sync-music/files.ts';
import { writeJsonFile } from './sync-music/json-file.ts';
import { findRecording } from './sync-music/musicbrainz.ts';
import { syncAudio } from './sync-music/r2.ts';
import { createReport, type Report, saveReport } from './sync-music/report.ts';

const { values: options } = parseArgs({
  options: { force: { type: 'boolean', default: false } },
});

async function clearCaches(): Promise<void> {
  await Promise.all(
    [paths.musicBrainzCache, paths.coversCache].map((cachePath) =>
      rm(cachePath, { recursive: true, force: true })
    )
  );
}

function compareTracks(left: Track, right: Track): number {
  return (
    left.artist.localeCompare(right.artist) ||
    left.year - right.year ||
    left.title.localeCompare(right.title)
  );
}

async function createTrack(local: LocalTrack, report: Report): Promise<Track> {
  console.info(`MusicBrainz: ${local.artist} - ${local.title}`);

  const match = await findRecording(local);
  const album = match?.album ?? local.album;
  const year = match?.year ?? local.year;

  if (!album || year === undefined) {
    throw new Error(
      `${local.filePath}: no album or year in the tags or in MusicBrainz. Add them to the tags.`
    );
  }

  if (match) {
    report.notes.push(
      `${local.id}: "${match.album}" (${String(match.year ?? '?')}), the earliest of ${String(match.albumsChecked)} original releases checked that has the song.`
    );
  } else {
    report.withoutMatch.push(`${local.artist} - ${local.title}`);
  }

  const cover = match ? await getCover(match.releaseGroupId) : undefined;

  if (!cover?.coverUrl) report.withoutCover.push(local.id);

  return {
    id: local.id,
    title: match?.title ?? local.title,
    artist: match?.artist ?? local.artist,
    album,
    year,
    durationSec: local.durationSec,
    audioUrl: `${audioBaseUrl}/${local.audioKey}`,
    ...(cover?.coverUrl ? { coverUrl: cover.coverUrl } : {}),
    ...(cover?.coverThumbUrl ? { coverThumbUrl: cover.coverThumbUrl } : {}),
  };
}

async function syncMusic(): Promise<void> {
  if (options.force) await clearCaches();

  const report = createReport();
  const localTracks = await readLocalTracks(report);
  const tracks: Track[] = [];

  for (const local of localTracks) {
    tracks.push(await createTrack(local, report));
  }

  await syncAudio(localTracks, report);
  await writeJsonFile(
    paths.tracksJson,
    tracksSchema.parse(tracks.toSorted(compareTracks))
  );

  report.tracks = tracks.length;
  await saveReport(report);
}

await syncMusic();
