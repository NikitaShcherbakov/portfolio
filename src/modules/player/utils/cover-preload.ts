const pendingCovers = new Map<string, Promise<void>>();
const readyCovers = new Set<string>();

async function decodeCover(url: string): Promise<void> {
  const image = new Image();

  image.decoding = 'async';
  image.src = url;

  try {
    await image.decode();
  } catch {
    // A broken cover still counts as settled: the image falls back to the placeholder, so nothing is left to wait for.
  }

  readyCovers.add(url);
}

export function getIsCoverReady(url: string | undefined): boolean {
  return url === undefined || readyCovers.has(url);
}

export function preloadCover(url: string | undefined): Promise<void> {
  if (!url) return Promise.resolve();

  let pending = pendingCovers.get(url);

  if (!pending) {
    pending = decodeCover(url);
    pendingCovers.set(url, pending);
  }

  return pending;
}
