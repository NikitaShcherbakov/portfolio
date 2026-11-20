import { type RefObject, useEffect, useRef } from 'react';

import { useMagazineStore } from '../stores/magazine-store';
import { runCurlFlight } from '../utils/curl-flight';

export function useCurlAnimation(bookRef: RefObject<HTMLElement | null>) {
  const flight = useMagazineStore.use.flight();
  const setBookMounted = useMagazineStore.use.setBookMounted();
  const startCurl = useMagazineStore.use.startCurl();
  const landFlight = useMagazineStore.use.landFlight();
  const finishCurl = useMagazineStore.use.finishCurl();
  const cancelCurlRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setBookMounted(true);

    return () => {
      cancelCurlRef.current?.();
      cancelCurlRef.current = null;
      setBookMounted(false);
    };
  }, [setBookMounted]);

  useEffect(() => {
    const book = bookRef.current;

    if (!book || !flight || cancelCurlRef.current) return;

    cancelCurlRef.current = runCurlFlight(book, flight, {
      onCurlStart: startCurl,
      onLand: landFlight,
      onEnd: () => {
        cancelCurlRef.current = null;
        finishCurl();
      },
    });
  }, [bookRef, flight, startCurl, landFlight, finishCurl]);
}
