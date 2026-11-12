import { Loader2 } from 'lucide-react';
import { useServerSlow } from '@/lib/request-status';

export function ServerWakeBanner() {
  const slow = useServerSlow();
  if (!slow) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-16 z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full border bg-card px-4 py-2 text-xs text-card-foreground shadow-lg"
    >
      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden />
      Server is waking up, please wait…
    </div>
  );
}
