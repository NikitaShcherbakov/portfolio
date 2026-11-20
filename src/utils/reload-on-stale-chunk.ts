import { captureError } from './capture-error';
import { readSessionValue, writeSessionValue } from './storage';

const reloadedAtKey = 'stale-chunk-reloaded-at';
const reloadCooldownMs = 10_000;
const entryScriptSelector = 'script[type="module"][src]';

let isCheckingDeploy = false;

function getEntryScript(root: ParentNode) {
  return root.querySelector(entryScriptSelector)?.getAttribute('src') ?? null;
}

async function isNewDeployLive() {
  const response = await fetch('/', { cache: 'no-store' });

  if (!response.ok) return false;

  const html = new DOMParser().parseFromString(
    await response.text(),
    'text/html'
  );
  const liveEntry = getEntryScript(html);

  return liveEntry !== null && liveEntry !== getEntryScript(document);
}

type StaleChunkOptions = {
  canReload: () => boolean;
  getReloadPath: () => string;
};

async function reloadIfStale({ canReload, getReloadPath }: StaleChunkOptions) {
  try {
    if (!(await isNewDeployLive()) || !canReload()) return;

    const reloadedAt = Number(readSessionValue(reloadedAtKey));

    if (Date.now() - reloadedAt < reloadCooldownMs) return;

    if (writeSessionValue(reloadedAtKey, String(Date.now()))) {
      window.location.assign(getReloadPath());
    }
  } catch (error) {
    captureError(error, { source: 'stale-chunk' });
  } finally {
    isCheckingDeploy = false;
  }
}

export function reloadOnStaleChunk(options: StaleChunkOptions) {
  window.addEventListener('vite:preloadError', () => {
    if (!navigator.onLine || isCheckingDeploy) return;

    isCheckingDeploy = true;
    void reloadIfStale(options);
  });
}
