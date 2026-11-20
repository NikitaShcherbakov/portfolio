let preloader: HTMLAudioElement | null = null;

function getPreloader() {
  if (!preloader) {
    preloader = new Audio();
    preloader.crossOrigin = 'anonymous';
    preloader.preload = 'auto';
    preloader.muted = true;
  }

  return preloader;
}

export function preloadAudio(url: string) {
  const element = getPreloader();

  if (element.src !== url) element.src = url;
}

export function cancelAudioPreload() {
  if (!preloader?.getAttribute('src')) return;

  preloader.removeAttribute('src');
  preloader.load();
}
