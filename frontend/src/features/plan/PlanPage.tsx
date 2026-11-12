import { Link } from 'react-router-dom';
import { ChevronRight, Dumbbell, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/error-state';
import { DAY_LABELS, MUSCLE_LABELS } from '@/lib/dates';
import type { PlanDay } from '@/lib/types';
import { usePlan } from './api';

function DayRow({ day }: { day: PlanDay }) {
  const exerciseCount = day.muscles.reduce((total, group) => total + group.exercises.length, 0);
  const isRest = day.muscles.length === 0;

  return (
    <Link
      to={`/plan/${day.day}`}
      className="group flex min-h-[76px] items-center gap-3 rounded-2xl border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-semibold uppercase text-muted-foreground">
        {day.day}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{isRest ? `Set ${DAY_LABELS[day.day]}` : DAY_LABELS[day.day]}</span>
          {isRest ? <Badge variant="muted">Rest</Badge> : null}
        </span>
        <span className="mt-1 block truncate text-sm text-muted-foreground">
          {isRest
            ? 'Set up muscles or keep it as a rest day.'
            : `${day.muscles.map((group) => MUSCLE_LABELS[group.muscle]).join(' · ')} — ${exerciseCount} exercise${
                exerciseCount === 1 ? '' : 's'
              }`}
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

export default function PlanPage() {
  const { data: plan, isLoading, isError, error, refetch } = usePlan();
  const hasAnything = plan?.days.some((day) => day.muscles.length > 0) ?? false;

  return (
    <div className="container-page py-6 sm:py-8">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Weekly plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick the muscles for each day. Each day can hold up to four.
          </p>
        </div>
        <Link to="/exercises">
          <Button variant="outline">
            <Dumbbell className="h-4 w-4" /> Browse library
          </Button>
        </Link>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-[76px] w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          {!hasAnything ? (
            <Card className="mb-4 border-primary/25 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Moon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">Start with one day</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tap Monday, choose a muscle, and add your first exercise. You can copy the habit
                    across the rest of the week.
                  </p>
                  <Link to="/plan/mon" className="mt-3 inline-block">
                    <Button size="sm">Set Monday</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ) : null}

          <div className="space-y-2.5">
            {plan?.days.map((day) => <DayRow key={day.day} day={day} />)}
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            A day with no muscles is a rest day. Rest days do not count against consistency.
          </p>
        </>
      )}
    </div>
  );
}
