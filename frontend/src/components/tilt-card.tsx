import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}

/**
 * Small cursor-driven tilt with a soft light sweep and a hover/focus outline.
 * Pointer movement is applied directly to the element in a rAF to avoid React
 * re-renders on every mouse move.
 */
export function TiltCard({ children, className, maxTilt = 6 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const latest = useRef({ x: 0, y: 0 });
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  const applyTilt = () => {
    frame.current = null;
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = Math.max(0, Math.min(1, (latest.current.x - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (latest.current.y - rect.top) / rect.height));

    element.style.setProperty('--tilt-x', `${x * 100}%`);
    element.style.setProperty('--tilt-y', `${y * 100}%`);
    element.style.transform = `perspective(950px) rotateX(${((0.5 - y) * maxTilt).toFixed(
      2
    )}deg) rotateY(${((x - 0.5) * maxTilt).toFixed(2)}deg) translateY(-4px) scale(1.008)`;
    element.dataset.tilting = 'true';
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || reducedMotion) return;
    latest.current = { x: event.clientX, y: event.clientY };
    if (frame.current === null) frame.current = requestAnimationFrame(applyTilt);
  };

  const reset = () => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    const element = ref.current;
    if (!element) return;
    element.style.transform = '';
    element.style.setProperty('--tilt-x', '50%');
    element.style.setProperty('--tilt-y', '50%');
    element.dataset.tilting = 'false';
  };

  return (
    <div
      ref={ref}
      className={cn('tilt-card', className)}
      data-tilting="false"
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
    >
      {children}
    </div>
  );
}
