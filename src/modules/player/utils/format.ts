import type { Track } from '@/content/schemas';
import { clamp } from '@/utils/clamp';

const secondsPerMinute = 60;
const percentPrecision = 10;

function padTwoDigits(value: number) {
  return String(value).padStart(2, '0');
}

function getMinutesAndSeconds(totalSec: number) {
  const wholeSec = Math.max(0, Math.floor(totalSec));

  return {
    minutes: Math.floor(wholeSec / secondsPerMinute),
    seconds: padTwoDigits(wholeSec % secondsPerMinute),
  };
}

export function getDiscLabel({
  artist,
  album,
  year,
}: Pick<Track, 'artist' | 'album' | 'year'>) {
  return `${artist} · ${album} · ${String(year)}`;
}

export function formatElapsed(totalSec: number) {
  const { minutes, seconds } = getMinutesAndSeconds(totalSec);

  return `${padTwoDigits(minutes)}:${seconds}`;
}

export function formatDuration(totalSec: number) {
  const { minutes, seconds } = getMinutesAndSeconds(totalSec);

  return `${String(minutes)}:${seconds}`;
}

export function getProgressPercent(value: number, total: number) {
  const percent =
    Math.round((value / total) * 100 * percentPrecision) / percentPrecision;

  return clamp(percent, 0, 100);
}

export function padTrackNumber(
  trackNumber: number,
  trackCount: number,
  minDigits = 1
) {
  const digits = Math.max(minDigits, String(trackCount).length);

  return String(trackNumber).padStart(digits, '0');
}
