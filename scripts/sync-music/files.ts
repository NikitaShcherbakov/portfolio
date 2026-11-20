import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseBuffer } from 'music-metadata';

import { audioKeyPrefix, paths } from './config.ts';
import { cleanFileName, createSlug } from './normalize.ts';
import type { Report } from './report.ts';

export type LocalTrack = {
  id: string;
  filePath: string;
  hash: string;
  audioKey: string;
  title: string;
  artist: string;
  album?: string;
  year?: number;
  durationSec: number;
};

const hashLength = 8;
const fileNameSeparator = ' - ';

async function listMp3Files(): Promise<string[]> {
  let entries;

  try {
    entries = await readdir(paths.music, {
      recursive: true,
      withFileTypes: true,
    });
  } catch (error) {
    throw new Error(
      `Folder ${paths.music} not found: create it and drop mp3 files there.`,
      { cause: error }
    );
  }

  const files = entries
    .filter((entry) => entry.isFile() && /\.mp3$/i.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort((left, right) => left.localeCompare(right));

  if (files.length === 0) {
    throw new Error(`No mp3 files in ${paths.music}.`);
  }

  return files;
}

function parseFileName(filePath: string): Pick<LocalTrack, 'artist' | 'title'> {
  const baseName = cleanFileName(
    path.basename(filePath, path.extname(filePath))
  );
  const separatorIndex = baseName.indexOf(fileNameSeparator);

  if (separatorIndex <= 0) {
    throw new Error(
      `${filePath} has no title or artist tag, and its name is not "Artist - Title.mp3".`
    );
  }

  return {
    artist: baseName.slice(0, separatorIndex).trim(),
    title: baseName.slice(separatorIndex + fileNameSeparator.length).trim(),
  };
}

function getTagText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  return trimmed === '' ? undefined : trimmed;
}

async function readLocalTrack(
  filePath: string
): Promise<Omit<LocalTrack, 'id' | 'audioKey'>> {
  const buffer = await readFile(filePath);
  const { common, format } = await parseBuffer(
    buffer,
    { mimeType: 'audio/mpeg', size: buffer.length },
    { duration: true }
  );

  if (format.duration === undefined) {
    throw new Error(`${filePath}: could not read the audio duration.`);
  }

  const tagTitle = getTagText(common.title);
  const tagArtist = getTagText(common.artist);
  const names =
    tagTitle && tagArtist
      ? { artist: tagArtist, title: tagTitle }
      : parseFileName(filePath);
  const album = getTagText(common.album);
  const hash = createHash('sha256')
    .update(buffer)
    .digest('hex')
    .slice(0, hashLength);

  return {
    filePath,
    hash,
    ...names,
    ...(album ? { album } : {}),
    ...(common.year ? { year: common.year } : {}),
    durationSec: Math.round(format.duration),
  };
}

function getUniqueId(baseId: string, usedIds: Set<string>): string {
  let id = baseId;

  for (let suffix = 2; usedIds.has(id); suffix += 1) {
    id = `${baseId}-${String(suffix)}`;
  }

  usedIds.add(id);

  return id;
}

export async function readLocalTracks(report: Report): Promise<LocalTrack[]> {
  const usedIds = new Set<string>();
  const tracks: LocalTrack[] = [];

  for (const filePath of await listMp3Files()) {
    const track = await readLocalTrack(filePath);
    const baseId =
      createSlug(`${track.artist}-${track.title}`) || `track-${track.hash}`;
    const id = getUniqueId(baseId, usedIds);

    if (id !== baseId) {
      report.notes.push(`${filePath}: id "${baseId}" taken, used "${id}".`);
    }

    tracks.push({
      ...track,
      id,
      audioKey: `${audioKeyPrefix}${id}.${track.hash}.mp3`,
    });
  }

  return tracks;
}
