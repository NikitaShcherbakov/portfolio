import type { Track } from '@/content/schemas';

const placeholderSize = 300;
const hueCount = 360;
const hueShift = 30;
const maxInitials = 2;
const skippedWords = new Set(['the']);

const placeholderCache = new Map<string, string>();

function getHue(value: string) {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % hueCount;
  }

  return hash;
}

function getFirstLetter(word: string) {
  return (Array.from(word)[0] ?? '').toUpperCase();
}

function getInitials(artist: string) {
  const words = artist.trim().split(/\s+/).filter(Boolean);
  const meaningfulWords = words.filter(
    (word) => !skippedWords.has(word.toLowerCase())
  );
  const sourceWords = meaningfulWords.length > 0 ? meaningfulWords : words;

  return sourceWords.slice(0, maxInitials).map(getFirstLetter).join('');
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function createPlaceholderSvg(artist: string) {
  const hue = getHue(artist);
  const size = String(placeholderSize);
  const startColor = `hsl(${String(hue)} 46% 32%)`;
  const endColor = `hsl(${String((hue + hueShift) % hueCount)} 50% 55%)`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">`,
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
    `<stop offset="0" stop-color="${startColor}"/>`,
    `<stop offset="1" stop-color="${endColor}"/>`,
    '</linearGradient></defs>',
    '<rect width="100%" height="100%" fill="url(#g)"/>',
    '<text x="50%" y="175" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="90" fill="rgba(255,255,255,.85)">',
    escapeXml(getInitials(artist)),
    '</text></svg>',
  ].join('');
}

export function getCoverPlaceholder({ artist }: Pick<Track, 'artist'>) {
  const cached = placeholderCache.get(artist);

  if (cached) {
    return cached;
  }

  const dataUrl = `data:image/svg+xml,${encodeURIComponent(createPlaceholderSvg(artist))}`;
  placeholderCache.set(artist, dataUrl);

  return dataUrl;
}
