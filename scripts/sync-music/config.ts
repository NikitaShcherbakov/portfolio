import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '../..');
const cacheDir = path.join(rootDir, '.cache');

export const paths = {
  music: path.join(rootDir, 'music'),
  musicBrainzCache: path.join(cacheDir, 'musicbrainz'),
  coversCache: path.join(cacheDir, 'covers'),
  report: path.join(cacheDir, 'report.json'),
  tracksJson: path.join(rootDir, 'src/content/tracks.json'),
} as const;

export const userAgent =
  'Portfolio/0.1.0 ( https://github.com/NikitaShcherbakov/portfolio )';

export const audioBaseUrl = 'https://portfolio-audio.rockfolio.workers.dev';
export const audioKeyPrefix = 'audio/';
export const audioCacheControl = 'public, max-age=31536000, immutable';
export const lengthToleranceSec = 5;
