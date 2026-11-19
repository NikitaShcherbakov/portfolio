import type { Plugin } from 'vite';
import * as z from 'zod/mini';

import { contentSchema } from '../src/content/schemas.ts';
import { readContentFiles } from './content-files.ts';

export function contentValidation(): Plugin {
  return {
    name: 'content-validation',
    async buildStart() {
      const result = contentSchema.safeParse(await readContentFiles());

      if (!result.success) {
        this.error(`src/content is invalid:\n${z.prettifyError(result.error)}`);
      }
    },
  };
}
