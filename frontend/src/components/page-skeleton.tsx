import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="container-page py-6" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-3 h-4 w-72 max-w-full" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className="surface p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-4 h-2 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-6 h-40 w-full" />
    </div>
  );
}
