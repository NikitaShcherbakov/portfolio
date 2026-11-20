import { create } from 'zustand';

import { clamp } from '@/utils/clamp';
import { createSelectors } from '@/utils/create-selectors';

import { lastLeaf } from '../utils/magazine-entries';
import type { Flight } from '../utils/pages';
import { prefersReducedMotion } from '../utils/reduced-motion';

const wrapGuardMs = 700;
const listenTapMs = 2200;

type ListenTap = {
  trackId: string;
  count: number;
};

type MagazineState = {
  leaf: number;
  flight: Flight | null;
  curlLeaf: number | null;
  isSearchOpen: boolean;
  query: string;
  listenTap: ListenTap | null;
};

type MagazineActions = {
  flipTo: (target: number) => void;
  flipForward: () => void;
  flipBackward: () => void;
  goToNextBand: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  setQuery: (query: string) => void;
  tapListen: (trackId: string) => void;
  setBookMounted: (isMounted: boolean) => void;
  startCurl: (leaf: number) => void;
  landFlight: () => void;
  finishCurl: () => void;
};

const initialMagazineState: MagazineState = {
  leaf: 1,
  flight: null,
  curlLeaf: null,
  isSearchOpen: false,
  query: '',
  listenTap: null,
};

const useMagazineStoreBase = create<MagazineState & MagazineActions>()((
  set,
  get
) => {
  let isBookMounted = false;
  let queuedTarget: number | null = null;
  let curlEndedAt = 0;
  let wrappedAt = 0;
  let isWrapping = false;
  let listenTapTimer: ReturnType<typeof setTimeout> | undefined;

  const getIsCurlBusy = () => {
    const { flight, curlLeaf } = get();

    return flight !== null || curlLeaf !== null;
  };

  const getPendingLeaf = () => {
    const { flight, leaf } = get();

    if (queuedTarget !== null) return queuedTarget;

    return flight ? flight.to : leaf;
  };

  const landFlight = () => {
    const { flight } = get();

    if (flight) set({ leaf: flight.to, flight: null });
  };

  const finishCurl = () => {
    isWrapping = false;
    curlEndedAt = Date.now();
    set({ curlLeaf: null });

    const target = queuedTarget;

    queuedTarget = null;

    if (target !== null) {
      setTimeout(() => {
        get().flipTo(target);
      }, 0);
    }
  };

  return {
    ...initialMagazineState,

    flipTo: (target) => {
      const state = get();

      if (state.isSearchOpen || state.query) {
        state.closeSearch();
      }

      const to = clamp(target, 1, lastLeaf);

      if (getIsCurlBusy()) {
        queuedTarget = to;
        return;
      }

      const from = state.leaf;

      if (to === from) return;

      if (!isBookMounted || prefersReducedMotion()) {
        set({ leaf: to });
        return;
      }

      const isForward = to > from;
      const flight: Flight = { from, to, flipLeaf: isForward ? from : to };

      set({ leaf: flight.flipLeaf, flight });
    },

    flipForward: () => {
      get().flipTo(getPendingLeaf() + 1);
    },

    flipBackward: () => {
      get().flipTo(getPendingLeaf() - 1);
    },

    goToNextBand: () => {
      const now = Date.now();

      if (now - wrappedAt <= wrapGuardMs || isWrapping) return;

      const pendingLeaf = getPendingLeaf();
      const isIdle =
        !getIsCurlBusy() &&
        queuedTarget === null &&
        now - curlEndedAt > wrapGuardMs;

      if (pendingLeaf < lastLeaf) {
        get().flipTo(pendingLeaf + 1);
      } else if (isIdle) {
        wrappedAt = now;
        get().flipTo(1);
        isWrapping = getIsCurlBusy();
      }
    },

    openSearch: () => {
      set({ isSearchOpen: true });
    },

    closeSearch: () => {
      set({ isSearchOpen: false, query: '' });
    },

    setQuery: (query) => {
      set({ query });
    },

    tapListen: (trackId) => {
      set((state) => ({
        listenTap: { trackId, count: (state.listenTap?.count ?? 0) + 1 },
      }));
      clearTimeout(listenTapTimer);
      listenTapTimer = setTimeout(() => {
        set({ listenTap: null });
      }, listenTapMs);
    },

    setBookMounted: (isMounted) => {
      isBookMounted = isMounted;

      if (isMounted) return;

      clearTimeout(listenTapTimer);

      if (getIsCurlBusy()) {
        landFlight();
        queuedTarget = null;
        finishCurl();
      }

      set({ listenTap: null });
    },

    startCurl: (leaf) => {
      set({ curlLeaf: leaf });
    },

    landFlight,
    finishCurl,
  };
});

export const useMagazineStore = createSelectors(useMagazineStoreBase);
