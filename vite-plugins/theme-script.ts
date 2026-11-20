import type { Plugin } from 'vite';

import { createThemeScript } from '../src/modules/common/utils/theme.ts';

export function themeScript(): Plugin {
  return {
    name: 'theme-script',
    transformIndexHtml: () => [
      { tag: 'script', children: createThemeScript(), injectTo: 'head' },
    ],
  };
}
