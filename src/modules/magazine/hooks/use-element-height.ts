import { type RefObject, useLayoutEffect, useState } from 'react';

export function useElementHeight(ref: RefObject<HTMLElement | null>) {
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) return undefined;

    const measure = () => {
      setHeight(element.offsetHeight);
    };

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return height;
}
