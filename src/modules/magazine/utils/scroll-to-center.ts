import { getScrollBehavior } from './reduced-motion';

export function scrollToCenter(selector: string) {
  const element = document.querySelector(selector);

  if (!element) return;

  const isTallerThanViewport =
    element.getBoundingClientRect().height > window.innerHeight;

  element.scrollIntoView({
    behavior: getScrollBehavior(),
    block: isTallerThanViewport ? 'start' : 'center',
  });
}
