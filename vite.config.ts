import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

import { createThemeScript } from './src/modules/common/utils/theme.ts';

function themeScript(): Plugin {
  return {
    name: 'theme-script',
    transformIndexHtml: () => [
      { tag: 'script', children: createThemeScript(), injectTo: 'head' },
    ],
  };
}

export default defineConfig({
  plugins: [tailwindcss(), react(), themeScript()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: { outDir: 'build' },
  server: {
    port: 5173,
    strictPort: true,
    // Setting `deny` replaces Vite's default list (copied from vite 8.3), so it is repeated here
    // with wrangler's local secrets added.
    fs: {
      deny: [
        '.env',
        '.env.*',
        '*.{crt,pem,key,p12,pfx,cer,der}',
        '.npmrc',
        '.yarnrc.yml',
        '**/.git/**',
        '**/.dev.vars',
      ],
    },
  },
  test: {
    // Every test starts clean: no leaked mocks, stubbed globals or env vars.
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    // Plain logic runs in Node; React components run in jsdom.
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
    },
  },
});
