import type { Band } from '@/content/schemas';
import type { Language } from '@/i18n';

import { bandPhotoSize, coverSizePx, getMediumPhotoUrl } from './image-sizes';
import type { MagazineEntry } from './magazine-entries';

const markClasses = {
  None: '',
  Marker: 'hl-y',
  Pen: 'ul-pen',
} as const;

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

  let isMarked = false;

  return segments.flatMap((segment): TextSegment[] => {
    const at =
      isMarked || segment.className ? -1 : findWord(segment.text, word);

    if (at < 0) return [segment];

    isMarked = true;

    return [
      { text: segment.text.slice(0, at), className: markClasses.None },
      { text: word, className },
      {
        text: segment.text.slice(at + word.length),
        className: markClasses.None,
      },
    ].filter(({ text }) => text.length > 0);
  });
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

const nameSizes = [
  { maxLength: 12, size: '5.9cqw' },
  { maxLength: 16, size: '4.9cqw' },
] as const;

const longNameSize = '4cqw';

export function getNameSize(name: string) {
  return (
    nameSizes.find(({ maxLength }) => name.length <= maxLength)?.size ??
    longNameSize
  );
}

export function getCity(origin: string) {
  return origin.split(',')[0] ?? origin;
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

export function formatMembers(members: Band['copy'][Language]['members']) {
  return `${members.map(({ name, role }) => `${name} — ${role}`).join('; ')}.`;
}

export function trimTrailingPeriod(text: string) {
  return text.replace(/\.$/, '');
}

export function getEntryCopy(
  { band, song }: MagazineEntry,
  language: Language
) {
  return { bandCopy: band.copy[language], songCopy: song.copy[language] };
}
