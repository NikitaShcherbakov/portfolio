import { readFile } from 'node:fs/promises';

import { languages } from '../src/i18n/languages.ts';

const contentFiles = ['tracks', 'bands', 'contacts'];

async function readJson(relativePath: string): Promise<unknown> {
  const url = new URL(`../src/content/${relativePath}`, import.meta.url);

  return JSON.parse(await readFile(url, 'utf8'));
}

async function readJsonFiles(names: readonly string[], directory = '') {
  const entries = await Promise.all(
    names.map(
      async (name) =>
        [name, await readJson(`${directory}${name}.json`)] as const
    )
  );

  return Object.fromEntries(entries);
}

export async function readContentFiles() {
  const [files, bandCopy] = await Promise.all([
    readJsonFiles(contentFiles),
    readJsonFiles(languages, 'band-copy/'),
  ]);

  return { ...files, bandCopy };
}
