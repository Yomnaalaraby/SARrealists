'use client';

import { useEffect, useState, type RefObject } from 'react';

export function usePixelScale(
  containerRef: RefObject<HTMLElement | null>,
  logicalWidth = 160,
  logicalHeight = 90,
): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const update = (): void => {
      const rect = element.getBoundingClientRect();
      const next = Math.max(
        1,
        Math.floor(Math.min(rect.width / logicalWidth, rect.height / logicalHeight)),
      );
      setScale(next);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [containerRef, logicalHeight, logicalWidth]);

  return scale;
}
