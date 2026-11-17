import { getScrollBehavior } from './reduced-motion';

export function scrollToCenter(selector: string) {
  document
    .querySelector(selector)
    ?.scrollIntoView({ behavior: getScrollBehavior(), block: 'center' });
}
