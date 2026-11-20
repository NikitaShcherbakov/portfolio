import { runCurlAnimation } from './curl-animation';
import { findFace, findLeaf } from './leaf-elements';
import type { Flight } from './pages';

const maxDomWaitFrames = 20;
const maxTurnWaitFrames = 30;
const turnedRotation = '-180';

type CurlFlightCallbacks = {
  onCurlStart: (leaf: number) => void;
  onLand: () => void;
  onEnd: () => void;
};

function isLeafTurned(leaf: HTMLElement) {
  return leaf.style.transform.includes(turnedRotation);
}

export function runCurlFlight(
  book: HTMLElement,
  flight: Flight,
  { onCurlStart, onLand, onEnd }: CurlFlightCallbacks
) {
  const isForward = flight.to > flight.from;
  const underIndex = isForward ? flight.to : flight.from;
  let isCancelled = false;
  let frameId = 0;
  let domWaitFrames = 0;
  let turnWaitFrames = 0;
  let curlingLeaf: HTMLElement | null = null;
  let cancelAnimations: (() => void) | null = null;

  const scheduleFrame = (callback: () => void) => {
    frameId = requestAnimationFrame(callback);
  };

  const clearCurlClass = () => {
    curlingLeaf?.classList.remove('curl');
  };

  const stopCurl = () => {
    clearCurlClass();
    onEnd();
  };

  const finishTurn = () => {
    cancelAnimations?.();
    stopCurl();
  };

  const waitForTurn = (leafElement: HTMLElement) => {
    if (isCancelled) return;

    const isStillTurning =
      !isLeafTurned(leafElement) &&
      leafElement.isConnected &&
      turnWaitFrames++ < maxTurnWaitFrames;

    if (isStillTurning) {
      scheduleFrame(() => {
        waitForTurn(leafElement);
      });
      return;
    }

    finishTurn();
  };

  const handleCurlFinish = (leafElement: HTMLElement) => {
    if (isCancelled) return;

    onLand();

    if (isForward) {
      scheduleFrame(() => {
        waitForTurn(leafElement);
      });
    } else {
      finishTurn();
    }
  };

  const tryStart = () => {
    if (isCancelled) return;

    const leafElement = findLeaf(book, flight.flipLeaf);
    const underElement = findLeaf(book, underIndex);
    const isNotReady =
      !leafElement || !underElement || isLeafTurned(leafElement);

    if (isNotReady && domWaitFrames++ < maxDomWaitFrames) {
      scheduleFrame(tryStart);
      return;
    }

    if (!leafElement || !underElement) {
      onLand();
      onEnd();
      return;
    }

    leafElement.classList.add('curl');
    curlingLeaf = leafElement;
    onCurlStart(flight.flipLeaf);

    cancelAnimations = runCurlAnimation(
      isForward,
      {
        front: findFace(leafElement, 'front'),
        back: findFace(leafElement, 'back'),
        under: findFace(underElement, 'front'),
      },
      () => {
        handleCurlFinish(leafElement);
      }
    );

    if (!cancelAnimations) {
      onLand();
      stopCurl();
    }
  };

  scheduleFrame(tryStart);

  return () => {
    isCancelled = true;
    cancelAnimationFrame(frameId);
    cancelAnimations?.();
    clearCurlClass();
  };
}
