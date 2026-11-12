import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiError } from '@/lib/api';

export function ErrorState({
  error,
  onRetry,
  title = 'Could not load this page'
}: {
  error?: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const message = error ? getApiError(error).message : 'Something went wrong.';
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" /> Try again
        </Button>
      ) : null}
    </div>
  );
}
