const versionWords =
  'remaster(?:ed)?|live|demo|version|edit|mix|mono|stereo|bonus|single|explicit|acoustic|radio';
const bracketSuffixPattern = new RegExp(
  `\\s*[([][^)\\]]*\\b(?:${versionWords})\\b[^)\\]]*[)\\]]\\s*$`,
  'i'
);
const dashSuffixPattern = new RegExp(
  `\\s+-\\s+[^-]*\\b(?:${versionWords})\\b[^-]*$`,
  'i'
);
const siteTagPattern =
  /\s*[([][^)\]]*\b[\w-]+\.(?:cc|com|net|org|ru|fm|me|info|io|biz|su|ua|by)\b[^)\]]*[)\]]/gi;
const apostrophePattern = /['’`´]/g;

function foldText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replaceAll('&', ' and ')
    .replace(apostrophePattern, '');
}

export function normalizeText(value: string): string {
  return foldText(value)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function normalizeArtist(value: string): string {
  return normalizeText(value).replace(/^the /, '');
}

export function stripVersionSuffix(title: string): string {
  let result = title.trim();
  let previous = '';

  while (result !== previous) {
    previous = result;
    result = result
      .replace(bracketSuffixPattern, '')
      .replace(dashSuffixPattern, '')
      .trim();
  }

  return result;
}

export function normalizeTitle(value: string): string {
  return normalizeText(stripVersionSuffix(value));
}

export function cleanFileName(baseName: string): string {
  return baseName
    .replaceAll('_', ' ')
    .replace(siteTagPattern, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function createSlug(value: string): string {
  return foldText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
