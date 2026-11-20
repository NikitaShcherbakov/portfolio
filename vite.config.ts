import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

import { contentValidation } from './vite-plugins/content-validation.ts';
import { themeScript } from './vite-plugins/theme-script.ts';
import { vercelConfig } from './vite-plugins/vercel-config.ts';

function isMagazineDecoAsset(filePath: string) {
  return filePath
    .replaceAll('\\', '/')
    .includes('/src/modules/magazine/assets/deco/');
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    themeScript(),
    contentValidation(),
    vercelConfig(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    outDir: 'build',
    assetsInlineLimit: (filePath) =>
      isMagazineDecoAsset(filePath) ? false : undefined,
  },
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
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
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
