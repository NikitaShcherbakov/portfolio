import { getBandCopy } from '@/content/band-copy';
import type { BandCopy } from '@/content/schemas';
import type { Language } from '@/i18n';
import { invariant } from '@/utils/invariant';

import { bandPhotoSize, coverSizePx, getMediumPhotoUrl } from './image-sizes';
import type { MagazineEntry } from './magazine-entries';

const markClasses = {
  None: '',
  Marker: 'hl-y',
  Pen: 'ul-pen',
} as const;

const nameSizes = [
  { maxLength: 12, size: '5.9cqw' },
  { maxLength: 16, size: '4.9cqw' },
] as const;

const longNameSize = '4cqw';

type MarkClass = (typeof markClasses)[keyof typeof markClasses];

type TextSegment = {
  text: string;
  className: MarkClass;
};

type ArticleDate = {
  year: number;
  album: string | null;
  isHighlighted: boolean;
};

type Mark = {
  word: string | undefined;
  className: MarkClass;
};

function findWord(text: string, word: string) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return text.search(
    new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'u')
  );
}

function markOnce(segments: TextSegment[], { word, className }: Mark) {
  if (!word) return segments;

  const index = segments.findIndex(
    ({ text, className: marked }) => !marked && findWord(text, word) >= 0
  );
  const segment = segments[index];

  if (!segment) return segments;

  const at = findWord(segment.text, word);
  const parts = [
    { text: segment.text.slice(0, at), className: markClasses.None },
    { text: word, className },
    {
      text: segment.text.slice(at + word.length),
      className: markClasses.None,
    },
  ].filter(({ text }) => text.length > 0);

  return segments.toSpliced(index, 1, ...parts);
}

export function getBody({ band, track }: MagazineEntry, body: string) {
  const rest = body.slice(1);
  const markerWord = [...band.highlights, track.album, track.title].find(
    (word) => findWord(rest, word) >= 0
  );
  const segments = [
    { word: markerWord, className: markClasses.Marker },
    { word: band.underline, className: markClasses.Pen },
  ].reduce<TextSegment[]>(markOnce, [
    { text: rest, className: markClasses.None },
  ]);

  return { initial: body.charAt(0), segments };
}

function isSameAlbum(first: string, second: string) {
  return first.startsWith(second) || second.startsWith(first);
}

export function getArticleDates({ band, track }: MagazineEntry): ArticleDate[] {
  const albumDates = band.albums.map(({ title, year }) => ({
    year,
    album: title,
    isHighlighted: isSameAlbum(title, track.album),
  }));

  return [
    { year: band.sinceYear, album: null, isHighlighted: false },
    ...albumDates,
  ].toSorted((first, second) => first.year - second.year);
}

export function getNameSize(name: string) {
  return (
    nameSizes.find(({ maxLength }) => name.length <= maxLength)?.size ??
    longNameSize
  );
}

export function getHeroImage({ band, track }: MagazineEntry) {
  if (band.photoUrl === undefined) {
    return {
      isPhoto: false,
      src: track.coverUrl,
      largeSrc: track.coverLargeUrl,
      width: coverSizePx,
      height: coverSizePx,
    };
  }

  return {
    isPhoto: true,
    src: getMediumPhotoUrl(band.photoUrl),
    largeSrc: band.photoUrl,
    ...bandPhotoSize,
  };
}

export function formatMembers(members: BandCopy['members']) {
  return `${members.map(({ name, role }) => `${name} — ${role}`).join('; ')}.`;
}

export function trimTrailingPeriod(text: string) {
  return text.replace(/\.$/, '');
}

export function getEntryCopy(
  { band, song }: MagazineEntry,
  language: Language
) {
  const { bands, songs } = getBandCopy(language);
  const bandCopy = bands[band.artist];
  const songCopy = songs[song.trackId];

  invariant(
    bandCopy && songCopy,
    `band-copy/${language}.json has no copy for "${band.artist}" / "${song.trackId}".`
  );

  return { bandCopy, songCopy };
}
