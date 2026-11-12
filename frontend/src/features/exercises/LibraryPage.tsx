import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  ExternalLink,
  Plus,
  Search,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ResponsiveSheet } from '@/components/ui/responsive-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { useDebounce } from '@/hooks/use-debounce';
import {
  DAY_KEYS,
  DAY_LABELS,
  MUSCLES,
  MUSCLE_LABELS,
  type DayKey,
  type Muscle
} from '@/lib/dates';
import type { Exercise } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useExercises } from './api';
import { ExerciseCard } from './ExerciseCard';
import { AddToPlanSheet } from './AddToPlanSheet';
import { CustomExerciseSheet } from './CustomExerciseSheet';

type Source = 'all' | 'library' | 'mine';

const PAGE_SIZE = 20;

function isDay(value: string | null): value is DayKey {
  return Boolean(value && (DAY_KEYS as readonly string[]).includes(value));
}

function isMuscle(value: string | null): value is Muscle {
  return Boolean(value && (MUSCLES as readonly string[]).includes(value));
}

export default function LibraryPage() {
  const [params, setParams] = useSearchParams();
  const day = isDay(params.get('day')) ? (params.get('day') as DayKey) : undefined;
  const mode = params.get('mode');
  const muscleParam = params.get('muscle');
  const muscle = isMuscle(muscleParam) ? muscleParam : undefined;
  const contextActive = Boolean(day && mode === 'add');

  const [search, setSearch] = useState(params.get('q') ?? '');
  const debouncedSearch = useDebounce(search);
  const [source, setSource] = useState<Source>('all');
  const [page, setPage] = useState(1);

  const [detail, setDetail] = useState<Exercise | null>(null);
  const [addTarget, setAddTarget] = useState<Exercise | null>(null);
  const [customOpen, setCustomOpen] = useState(false);

  const query = useExercises({ search: debouncedSearch, muscle, source, page, limit: PAGE_SIZE });
  const data = query.data;

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const selectMuscle = (value?: Muscle) => {
    updateParam('muscle', value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    selectMuscle(undefined);
    setSource('all');
    setPage(1);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="container-page py-5 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Exercise library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find a movement, then add it to a day in your plan.
          </p>
        </div>
        <Button variant="outline" onClick={() => setCustomOpen(true)}>
          <Plus className="h-4 w-4" /> New exercise
        </Button>
      </div>

      {contextActive ? (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/8 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <span className="font-medium">Adding to {DAY_LABELS[day!]}</span>
            {muscle ? <span className="text-muted-foreground"> · {MUSCLE_LABELS[muscle]}</span> : null}
            <p className="text-xs text-muted-foreground">Pick as many exercises as you need, then tap Done.</p>
          </div>
          <Link to={`/plan/${day}`}>
            <Button size="sm" variant="secondary" className="w-full sm:w-auto">
              Done
            </Button>
          </Link>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search exercises"
            aria-label="Search exercises"
            className="pl-9"
          />
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => selectMuscle(undefined)}
              className={cn(
                'min-h-10 shrink-0 rounded-full border px-3.5 text-sm font-medium',
                !muscle ? 'border-primary/40 bg-primary/15 text-primary' : 'bg-background text-muted-foreground'
              )}
            >
              All muscles
            </button>
            {MUSCLES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => selectMuscle(item)}
                aria-pressed={muscle === item}
                className={cn(
                  'min-h-10 shrink-0 rounded-full border px-3.5 text-sm font-medium',
                  muscle === item
                    ? 'border-primary/40 bg-primary/15 text-primary'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                )}
              >
                {MUSCLE_LABELS[item]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-xl border bg-muted/30 p-1" role="group" aria-label="Exercise source">
            {(
              [
                ['all', 'All'],
                ['library', 'Library'],
                ['mine', 'Mine']
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSource(value);
                  setPage(1);
                }}
                aria-pressed={source === value}
                className={cn(
                  'h-8 rounded-lg px-3 text-xs font-medium transition-colors',
                  source === value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {data ? (
            <p className="text-xs text-muted-foreground">
              {data.total} exercise{data.total === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        {query.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="p-4">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="mt-3 h-5 w-40" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-4 h-9 w-full" />
              </Card>
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : data && data.items.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="No exercises found"
            description="Try a different search, muscle, or source filter."
            action={
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4" /> Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data?.items.map((exercise) => (
                <ExerciseCard
                  key={exercise._id}
                  exercise={exercise}
                  onDetails={() => setDetail(exercise)}
                  onAdd={contextActive ? () => setAddTarget(exercise) : undefined}
                />
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={!data?.hasMore}
                onClick={() => setPage((current) => current + 1)}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      <ResponsiveSheet
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        title={detail?.name ?? 'Exercise'}
        description={detail ? `${MUSCLE_LABELS[detail.targetMuscle]} · ${detail.sets.length} sets` : undefined}
        footer={
          detail && contextActive ? (
            <Button
              className="w-full"
              onClick={() => {
                setAddTarget(detail);
                setDetail(null);
              }}
            >
              <Plus className="h-4 w-4" /> Add to plan
            </Button>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setDetail(null)}>
              Close
            </Button>
          )
        }
      >
        {detail ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{MUSCLE_LABELS[detail.targetMuscle]}</Badge>
              {detail.isCustom ? <Badge variant="muted">My exercise</Badge> : <Badge variant="outline">Library</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{detail.description || 'No description yet.'}</p>

            <div>
              <p className="mb-2 text-sm font-medium">Default sets</p>
              <div className="space-y-1.5">
                {detail.sets.map((set, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                    <span>Set {index + 1}</span>
                    <span className="text-muted-foreground">
                      {set.tag === 'failure' ? 'Failure' : 'Normal'} · {set.repetitions} reps
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {detail.links.length ? (
              <div>
                <p className="mb-2 text-sm font-medium">Links</p>
                <ul className="space-y-1.5">
                  {detail.links.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        {link.label || link.url} <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </ResponsiveSheet>

      {day ? (
        <AddToPlanSheet
          exercise={addTarget}
          day={day}
          muscle={muscle}
          open={Boolean(addTarget)}
          onOpenChange={(open) => {
            if (!open) setAddTarget(null);
          }}
        />
      ) : null}

      <CustomExerciseSheet
        open={customOpen}
        onOpenChange={setCustomOpen}
        day={contextActive ? day : undefined}
        lockedMuscle={contextActive ? muscle : undefined}
      />
    </div>
  );
}
