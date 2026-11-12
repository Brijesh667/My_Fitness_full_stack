import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function MovingBorder({
  children,
  className,
  innerClassName
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div className={cn('moving-border', className)}>
      <div className={cn('moving-border-inner', innerClassName)}>{children}</div>
    </div>
  );
}
