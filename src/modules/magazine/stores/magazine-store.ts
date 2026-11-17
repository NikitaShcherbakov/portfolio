import { create } from 'zustand';

import { clamp } from '@/utils/clamp';
import { createSelectors } from '@/utils/create-selectors';

import { runCurlAnimation } from '../utils/curl-animation';
import { findFace, findLeaf } from '../utils/leaf-elements';
import { lastLeaf } from '../utils/magazine-entries';
import type { Flight } from '../utils/pages';
import { prefersReducedMotion } from '../utils/reduced-motion';

const maxDomWaitFrames = 20;
const maxTurnWaitFrames = 30;
const wrapGuardMs = 700;
const listenTapMs = 2200;
const turnedRotation = '-180';

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
  attachBook: (book: HTMLElement | null) => void;
};

const initialMagazineState: MagazineState = {
  leaf: 1,
  flight: null,
  curlLeaf: null,
  isSearchOpen: false,
  query: '',
  listenTap: null,
};

function clampLeaf(leaf: number) {
  return clamp(leaf, 1, lastLeaf);
}

const useMagazineStoreBase = create<MagazineState & MagazineActions>()((
  set,
  get
) => {
  let book: HTMLElement | null = null;
  let isCurlBusy = false;
  let queuedTarget: number | null = null;
  let curlEndedAt = 0;
  let wrappedAt = 0;
  let isWrapping = false;
  let curlGeneration = 0;
  let cancelCurl: (() => void) | null = null;
  let listenTapTimer: ReturnType<typeof setTimeout> | undefined;

  const getPendingLeaf = () => {
    const { flight, leaf } = get();

    if (queuedTarget !== null) return queuedTarget;

    return flight ? flight.to : leaf;
  };

  const landFlight = (flight: Flight) => {
    set({ leaf: flight.to, flight: null });
  };

  const finishCurl = () => {
    cancelCurl = null;
    isCurlBusy = false;
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

  const startCurl = (bookElement: HTMLElement, flight: Flight) => {
    const isForward = flight.to > flight.from;
    const underIndex = isForward ? flight.to : flight.from;
    const generation = ++curlGeneration;
    const isStale = () => generation !== curlGeneration;
    let waitedFrames = 0;

    const tryStart = () => {
      if (isStale()) return;

      const leafElement = findLeaf(bookElement, flight.flipLeaf);
      const underElement = findLeaf(bookElement, underIndex);
      const isNotReady =
        !leafElement ||
        !underElement ||
        leafElement.style.transform.includes(turnedRotation);

      if (isNotReady && waitedFrames++ < maxDomWaitFrames) {
        requestAnimationFrame(tryStart);
        return;
      }

      if (!leafElement || !underElement) {
        landFlight(flight);
        finishCurl();
        return;
      }

      leafElement.classList.add('curl');
      set({ curlLeaf: flight.flipLeaf });

      const stopCurl = () => {
        leafElement.classList.remove('curl');
        finishCurl();
      };

      const cancelAnimations = runCurlAnimation(
        isForward,
        {
          front: findFace(leafElement, 'front'),
          back: findFace(leafElement, 'back'),
          under: findFace(underElement, 'front'),
        },
        () => {
          if (isStale()) return;

          landFlight(flight);

          let turnWaitFrames = 0;

          const waitForTurn = () => {
            if (isStale()) return;

            const isStillTurning =
              isForward &&
              !leafElement.style.transform.includes(turnedRotation) &&
              leafElement.isConnected &&
              turnWaitFrames++ < maxTurnWaitFrames;

            if (isStillTurning) {
              requestAnimationFrame(waitForTurn);
              return;
            }

            cancelCurl?.();
            stopCurl();
          };

          if (isForward) {
            requestAnimationFrame(waitForTurn);
          } else {
            waitForTurn();
          }
        }
      );

      cancelCurl = cancelAnimations;

      if (!cancelAnimations) {
        landFlight(flight);
        stopCurl();
      }
    };

    requestAnimationFrame(tryStart);
  };

  return {
    ...initialMagazineState,

    flipTo: (target) => {
      const state = get();

      if (state.isSearchOpen || state.query) {
        state.closeSearch();
      }

      const to = clampLeaf(target);

      if (state.flight || isCurlBusy) {
        queuedTarget = to;
        return;
      }

      const from = clampLeaf(state.leaf);

      if (to === from) return;

      if (!book || prefersReducedMotion()) {
        set({ leaf: to });
        return;
      }

      const isForward = to > from;
      const flight: Flight = { from, to, flipLeaf: isForward ? from : to };

      isCurlBusy = true;
      set({ leaf: flight.flipLeaf, flight });
      startCurl(book, flight);
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
        get().flight === null &&
        !isCurlBusy &&
        queuedTarget === null &&
        now - curlEndedAt > wrapGuardMs;

      if (pendingLeaf < lastLeaf) {
        get().flipTo(pendingLeaf + 1);
      } else if (isIdle) {
        wrappedAt = now;
        get().flipTo(1);
        isWrapping = isCurlBusy;
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

    attachBook: (element) => {
      book = element;

      if (element) return;

      curlGeneration++;
      cancelCurl?.();
      clearTimeout(listenTapTimer);

      const { flight, curlLeaf } = get();

      if (flight || curlLeaf !== null || isCurlBusy) {
        if (flight) landFlight(flight);
        queuedTarget = null;
        finishCurl();
      }

      set({ listenTap: null });
    },
  };
});

export const useMagazineStore = createSelectors(useMagazineStoreBase);
