import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app';
import { preloadBandCopy } from '@/content/band-copy';
import { getResolvedLanguage } from '@/i18n';
import { selectIsPlaybackActive, usePlayerStore } from '@/modules/player';
import { getIntendedPath } from '@/router';
import { captureError } from '@/utils/capture-error';
import { invariant } from '@/utils/invariant';
import { reloadOnStaleChunk } from '@/utils/reload-on-stale-chunk';

import './styles/index.css';

const bandCopyWaitMs = 2500;

reloadOnStaleChunk({
  canReload: () => !selectIsPlaybackActive(usePlayerStore.getState()),
  getReloadPath: getIntendedPath,
});

await Promise.race([
  preloadBandCopy(getResolvedLanguage()),
  new Promise((resolve) => setTimeout(resolve, bandCopyWaitMs)),
]);

const rootElement = document.getElementById('root');

invariant(rootElement, 'Root element #root is missing in index.html.');

createRoot(rootElement, {
  onUncaughtError: (error, { componentStack }) => {
    captureError(error, { source: 'react:uncaught', componentStack });
  },
  onCaughtError: (error, { componentStack }) => {
    captureError(error, { source: 'react:caught', componentStack });
  },
}).render(
  <StrictMode>
    <App />
  </StrictMode>
);
