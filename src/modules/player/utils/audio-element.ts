let audioElement: HTMLAudioElement | null = null;

export function getAudioElement() {
  if (!audioElement) {
    audioElement = document.createElement('audio');
    // The audio Worker serves files only to requests that carry an allowed Origin, which needs CORS mode.
    audioElement.crossOrigin = 'anonymous';
    audioElement.preload = 'metadata';
    audioElement.hidden = true;
    document.body.append(audioElement);
  }

  return audioElement;
}

function isDomError(error: unknown, name: string) {
  return error instanceof DOMException && error.name === name;
}

export function loadAudio(url: string) {
  const element = getAudioElement();

  if (element.src !== url || element.error !== null) {
    element.src = url;
  }
}

export async function playAudio() {
  try {
    await getAudioElement().play();

    return true;
  } catch (error) {
    // A newer src or pause() interrupted this play(): the newer call owns the playback state.
    if (isDomError(error, 'AbortError')) {
      return true;
    }

    if (
      isDomError(error, 'NotAllowedError') ||
      isDomError(error, 'NotSupportedError')
    ) {
      return false;
    }

    throw error;
  }
}

export function pauseAudio() {
  getAudioElement().pause();
}

export function seekAudio(seconds: number) {
  getAudioElement().currentTime = seconds;
}

export function setAudioVolume(volume: number, isMuted: boolean) {
  const element = getAudioElement();

  element.volume = volume;
  element.muted = isMuted;
}
