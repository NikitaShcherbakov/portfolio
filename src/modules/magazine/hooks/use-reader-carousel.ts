import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { useMagazineStore } from '../stores/magazine-store';
import {
  addPointerSample,
  getDragSide,
  getOppositeSide,
  isLeafInMagazine,
  isTurnGesture,
  type ReaderDrag,
  type ReaderSide,
} from '../utils/reader-drag';
import { prefersReducedMotion } from '../utils/reduced-motion';

export const readerPageGapPx = 24;

const dragStartPx = 10;
const edgeResistance = 0.3;
const turnMs = 420;
const settleMs = 300;
const easing = 'cubic-bezier(0.25, 0.8, 0.25, 1)';
const ignoredTargets = 'input, .j-res';

type ReaderPeek = {
  leaf: number;
  side: ReaderSide;
};

type ReaderCarouselRefs = {
  stageRef: RefObject<HTMLElement | null>;
  trackRef: RefObject<HTMLElement | null>;
};

export function useReaderCarousel(
  { stageRef, trackRef }: ReaderCarouselRefs,
  leaf: number
) {
  const flipTo = useMagazineStore.use.flipTo();
  const [peek, setPeek] = useState<ReaderPeek | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const leafRef = useRef(leaf);
  const shownLeafRef = useRef(leaf);
  const peekRef = useRef<ReaderPeek | null>(null);
  const releaseOffsetRef = useRef<number | null>(null);
  const animationRef = useRef<Animation | null>(null);
  const dragRef = useRef<ReaderDrag | null>(null);
  const suppressClickRef = useRef(false);

  const showPeek = useCallback((next: ReaderPeek | null) => {
    peekRef.current = next;
    setPeek(next);
  }, []);

  const getSpan = useCallback(
    () => (stageRef.current?.offsetWidth ?? 0) + readerPageGapPx,
    [stageRef]
  );

  const resetTrack = useCallback(() => {
    animationRef.current?.cancel();
    animationRef.current = null;

    if (trackRef.current) trackRef.current.style.transform = '';
  }, [trackRef]);

  const slideTrack = useCallback(
    (from: number, duration: number) => {
      resetTrack();

      const track = trackRef.current;

      if (!track) return;

      if (prefersReducedMotion() || typeof track.animate !== 'function') {
        showPeek(null);
        return;
      }

      const animation = track.animate(
        [{ transform: `translateX(${String(from)}px)` }, { transform: 'none' }],
        { duration, easing }
      );

      animationRef.current = animation;
      animation.onfinish = () => {
        if (animationRef.current !== animation) return;

        animationRef.current = null;
        showPeek(null);
      };
    },
    [trackRef, resetTrack, showPeek]
  );

  useLayoutEffect(() => {
    leafRef.current = leaf;

    const shownLeaf = shownLeafRef.current;

    if (shownLeaf === leaf) return;

    shownLeafRef.current = leaf;

    const side: ReaderSide = leaf > shownLeaf ? 1 : -1;
    const releaseOffset = releaseOffsetRef.current;
    const span = getSpan();

    releaseOffsetRef.current = null;

    if (prefersReducedMotion() || span <= readerPageGapPx) {
      resetTrack();
      showPeek(null);
      return;
    }

    showPeek({ leaf: shownLeaf, side: getOppositeSide(side) });
    slideTrack(
      releaseOffset ?? side * span,
      releaseOffset === null ? turnMs : settleMs
    );
  }, [leaf, getSpan, resetTrack, showPeek, slideTrack]);

  useEffect(() => {
    const stage = stageRef.current;
    const track = trackRef.current;

    if (!stage || !track) return undefined;

    const endDrag = (isCancelled: boolean, releaseTime = performance.now()) => {
      const drag = dragRef.current;

      dragRef.current = null;

      if (!drag?.isDragging) return;

      setIsDragging(false);
      suppressClickRef.current = true;

      const side = getDragSide(drag.offset);
      const target = leafRef.current + side;
      const span = getSpan();
      const shouldTurn =
        !isCancelled &&
        isLeafInMagazine(target) &&
        isTurnGesture(drag, span, releaseTime);

      if (shouldTurn) {
        releaseOffsetRef.current = drag.offset + side * span;
        flipTo(target);
        return;
      }

      slideTrack(drag.offset, settleMs);
    };

    const handlePointerDown = (event: PointerEvent) => {
      suppressClickRef.current = false;

      const isIgnored =
        event.target instanceof Element &&
        event.target.closest(ignoredTargets) !== null;
      const isMainButton = event.pointerType !== 'mouse' || event.button === 0;

      if (
        !event.isPrimary ||
        !isMainButton ||
        isIgnored ||
        animationRef.current
      ) {
        return;
      }

      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        isDragging: false,
        offset: 0,
        samples: [{ x: event.clientX, time: event.timeStamp }],
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;

      if (drag?.pointerId !== event.pointerId) return;

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;

      if (!drag.isDragging) {
        const isVertical =
          Math.abs(dy) > dragStartPx && Math.abs(dy) > Math.abs(dx);

        if (isVertical) {
          dragRef.current = null;
          return;
        }

        if (Math.abs(dx) < dragStartPx) return;

        drag.isDragging = true;
        setIsDragging(true);
        window.getSelection()?.removeAllRanges();
        stage.setPointerCapture(event.pointerId);
      }

      const side = getDragSide(dx);
      const target = leafRef.current + side;
      const canTurn = isLeafInMagazine(target);

      if (!canTurn && peekRef.current) {
        showPeek(null);
      } else if (canTurn && peekRef.current?.side !== side) {
        showPeek({ leaf: target, side });
      }

      drag.samples = addPointerSample(drag.samples, {
        x: event.clientX,
        time: event.timeStamp,
      });
      drag.offset = canTurn ? dx : dx * edgeResistance;
      track.style.transform = `translateX(${String(drag.offset)}px)`;
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (dragRef.current?.pointerId === event.pointerId) {
        endDrag(false, event.timeStamp);
      }
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (dragRef.current?.pointerId === event.pointerId) endDrag(true);
    };

    const handleLostPointerCapture = (event: PointerEvent) => {
      const isOwnCapture = event.target === stage;

      if (isOwnCapture && dragRef.current?.pointerId === event.pointerId) {
        endDrag(true);
      }
    };

    const handleWindowBlur = () => {
      endDrag(true);
    };

    const handleDragStart = (event: DragEvent) => {
      event.preventDefault();
    };

    const handleClickCapture = (event: MouseEvent) => {
      if (!suppressClickRef.current) return;

      suppressClickRef.current = false;

      const isKeyboardOrAssistiveClick = event.detail === 0;

      if (isKeyboardOrAssistiveClick) return;

      event.preventDefault();
      event.stopPropagation();
    };

    const listeners = new AbortController();
    const options = { signal: listeners.signal };

    stage.addEventListener('pointerdown', handlePointerDown, options);
    stage.addEventListener(
      'lostpointercapture',
      handleLostPointerCapture,
      options
    );
    stage.addEventListener('dragstart', handleDragStart, options);
    stage.addEventListener('click', handleClickCapture, {
      capture: true,
      signal: listeners.signal,
    });
    window.addEventListener('pointermove', handlePointerMove, options);
    window.addEventListener('pointerup', handlePointerUp, options);
    window.addEventListener('pointercancel', handlePointerCancel, options);
    window.addEventListener('blur', handleWindowBlur, options);

    return () => {
      listeners.abort();
      animationRef.current?.cancel();
      animationRef.current = null;
    };
  }, [stageRef, trackRef, flipTo, getSpan, showPeek, slideTrack]);

  return { peek, isDragging };
}
