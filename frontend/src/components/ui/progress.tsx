import { cn } from '@/lib/utils';

export function Progress({
  value,
  className,
  barClassName,
  label
}: {
  value: number;
  className?: string;
  barClassName?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div
      className={cn('h-2.5 w-full overflow-hidden rounded-full bg-muted', className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn(
          'h-full rounded-full bg-[linear-gradient(90deg,#bef264,#34d399)] transition-[width] duration-300',
          barClassName
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
