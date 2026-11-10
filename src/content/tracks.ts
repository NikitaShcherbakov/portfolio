import { type Track, tracksSchema } from './schemas';
import tracksJson from './tracks.json';

export const tracks = tracksSchema.parse(tracksJson);

export function getTrack(index: number): Track {
  const track = tracks[index];

  if (!track) {
    throw new Error(
      `Track index ${String(index)} is out of range (0..${String(tracks.length - 1)}).`
    );
  }

  return track;
}
