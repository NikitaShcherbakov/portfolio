import { useSyncExternalStore } from 'react';

import { readerLayoutQuery } from '../utils/image-sizes';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(readerLayoutQuery);

  query.addEventListener('change', onChange);

  return () => {
    query.removeEventListener('change', onChange);
  };
}

function getSnapshot() {
  return window.matchMedia(readerLayoutQuery).matches;
}

export function useIsReaderLayout() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
