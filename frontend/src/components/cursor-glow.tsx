import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';

/**
 * A very soft radial light that follows a fine pointer. It is skipped for touch
 * and reduced-motion users and updates outside React's render loop.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const apply = () => {
      frame.current = null;
      const element = ref.current;
      if (!element) return;
      element.style.setProperty('--cursor-x', `${pointer.current.x}px`);
      element.style.setProperty('--cursor-y', `${pointer.current.y}px`);
      element.dataset.active = 'true';
    };

    const onMove = (event: globalThis.PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      pointer.current = { x: event.clientX, y: event.clientY };
      if (frame.current === null) frame.current = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      if (ref.current) ref.current.dataset.active = 'false';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [reducedMotion]);

  return <div ref={ref} aria-hidden="true" className="cursor-glow" data-active="false" />;
}
