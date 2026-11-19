import { bands } from '@/content/bands';
import type { Band, Song, Track } from '@/content/schemas';
import { tracks } from '@/content/tracks';

export type MagazineEntry = {
  band: Band;
  song: Song;
  track: Track;
  trackIndex: number;
  leaf: number;
};

type SongTrack = Pick<MagazineEntry, 'track' | 'trackIndex'>;

function findSongTrack(song: Song): SongTrack | null {
  const trackIndex = tracks.findIndex(({ id }) => id === song.trackId);
  const track = tracks[trackIndex];

  return track ? { track, trackIndex } : null;
}

function createMagazineEntries(): MagazineEntry[] {
  return bands
    .toSorted((first, second) => first.sinceYear - second.sinceYear)
    .flatMap((band) =>
      band.songs
        .flatMap((song) => {
          const songTrack = findSongTrack(song);

          return songTrack ? [{ band, song, ...songTrack }] : [];
        })
        .toSorted((first, second) => first.trackIndex - second.trackIndex)
    )
    .map((entry, index) => ({ ...entry, leaf: index + 1 }));
}

export const magazineEntries = createMagazineEntries();

export const lastLeaf = magazineEntries.length;

export function getEntryAtLeaf(leaf: number) {
  return magazineEntries[leaf - 1];
}

export function getEntryName({ band, track }: MagazineEntry) {
  return `${band.name} — ${track.title}`;
}

export function getLeafByTrackIndex(trackIndex: number) {
  return (
    magazineEntries.find((entry) => entry.trackIndex === trackIndex)?.leaf ??
    null
  );
}

export function getMagazinePageNumber(leaf: number) {
  return leaf * 2 - 1;
}
