import { findFace, findLeaf } from './leaf-elements';

export const focusKeys = {
  FlipBackward: 'flip-backward',
  FlipForward: 'flip-forward',
  Previous: 'previous',
  Next: 'next',
  Listen: 'listen',
  Search: 'search',
  Random: 'random',
} as const;

export type FocusKey = (typeof focusKeys)[keyof typeof focusKeys];

const focusKeySet: ReadonlySet<string> = new Set(Object.values(focusKeys));

const fallbackKeys: readonly FocusKey[] = [
  focusKeys.Next,
  focusKeys.Previous,
  focusKeys.FlipForward,
  focusKeys.FlipBackward,
];

function isFocusKey(value: string | undefined): value is FocusKey {
  return value !== undefined && focusKeySet.has(value);
}

function isFocusable(element: Element): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    !element.matches(':disabled') &&
    getComputedStyle(element).visibility === 'visible'
  );
}

function findFocusTarget(book: HTMLElement, leaf: number, key: FocusKey) {
  const leafElement = findLeaf(book, leaf);
  const scopes = leafElement ? [findFace(leafElement, 'front'), book] : [book];

  for (const candidateKey of [key, ...fallbackKeys]) {
    for (const scope of scopes) {
      const target = [
        ...scope.querySelectorAll(`[data-focus-key="${candidateKey}"]`),
      ].find(isFocusable);

      if (target) return target;
    }
  }

  return null;
}

export function getFocusKey(element: EventTarget | null): FocusKey | null {
  if (!(element instanceof HTMLElement)) return null;

  const key =
    element.closest<HTMLElement>('[data-focus-key]')?.dataset.focusKey;

  return isFocusKey(key) ? key : null;
}

export async function waitForTransitions(element: HTMLElement) {
  const transitions = element
    .getAnimations({ subtree: true })
    .filter((animation) => animation instanceof CSSTransition);

  await Promise.allSettled(
    transitions.map((transition) => transition.finished)
  );
}

export function restoreFocus(book: HTMLElement, leaf: number, key: FocusKey) {
  const active = document.activeElement;
  const isInBook = active !== null && book.contains(active);
  const isFocusLost = active === null || active === document.body;
  const shouldKeepFocus = isInBook ? isFocusable(active) : !isFocusLost;

  if (shouldKeepFocus) return;

  findFocusTarget(book, leaf, key)?.focus();
}
