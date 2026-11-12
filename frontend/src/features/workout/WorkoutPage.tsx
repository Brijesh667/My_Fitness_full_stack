import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Flag,
  Moon,
  Play,
  Timer
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GradientButton } from '@/components/ui/gradient-button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { ConfirmDialog } from '@/components/confirm-dialog';
import {
  EXERCISE_STATUS_LABELS,
  MUSCLE_LABELS,
  formatDateLong,
  todayKey
} from '@/lib/dates';
import { getApiError } from '@/lib/api';
import { formatTimer } from '@/lib/utils';
import type { SessionExercise, WorkoutSession } from '@/lib/types';
import { useFinishSession, useStartSession, useToday } from './api';
import { SessionTimerBar } from './SessionTimerBar';

function statusVariant(status: SessionExercise['status']) {
  if (status === 'completed') return 'success' as const;
  if (status === 'in_progress') return 'warning' as const;
  if (status === 'partial') return 'warning' as const;
  if (status === 'skipped') return 'muted' as const;
  return 'outline' as const;
}

function Summary({ session }: { session: WorkoutSession }) {
  const failureSets = session.muscles
    .flatMap((group) => group.exercises)
    .flatMap((exercise) => exercise.sets)
    .filter((set) => set.completed && set.tag === 'failure').length;
  const exercises = session.muscles.flatMap((group) => group.exercises);

  return (
    <div className="space-y-4">
      <Card className="border-primary/25 bg-primary/5 p-5 text-center sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-3 text-xl font-semibold">Workout complete</h2>
        <p className="mt-1 text-sm text-muted-foreground">Saved for {formatDateLong(session.date)}.</p>

        <div className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Gym time</p>
            <p className="mt-1 font-semibold">{formatTimer(session.durationSec * 1000)}</p>
          </div>
          <div className="rounded-xl border bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Sets</p>
            <p className="mt-1 font-semibold">
              {session.completedSets}/{session.plannedSets}
            </p>
          </div>
          <div className="rounded-xl border bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Failure sets</p>
            <p className="mt-1 font-semibold">{failureSets}</p>
          </div>
        </div>

        <Link to="/dashboard" className="mt-6 inline-block">
          <GradientButton>Back to dashboard</GradientButton>
        </Link>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold">Exercise results</h3>
        <ul className="mt-3 space-y-2">
          {exercises.map((exercise) => (
            <li key={exercise.planExerciseId} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{exercise.name}</p>
                <p className="text-xs text-muted-foreground">
                  {exercise.sets.filter((set) => set.completed).length}/{exercise.sets.length} sets
                </p>
              </div>
              <Badge variant={statusVariant(exercise.status)}>
                {EXERCISE_STATUS_LABELS[exercise.status]}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export default function WorkoutPage() {
  const date = todayKey();
  const { data, isLoading, isError, error, refetch } = useToday(date);
  const start = useStartSession(date);
  const finish = useFinishSession(date);
  const [confirmFinish, setConfirmFinish] = useState(false);

  const session = data?.session ?? null;
  const preview = data?.preview ?? null;

  if (isLoading) {
    return (
      <div className="container-page space-y-4 py-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container-page py-6">
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  const header = (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {formatDateLong(date)}
        </p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Today’s workout</h1>
      </div>
      <Link to="/dashboard">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Button>
      </Link>
    </header>
  );

  if (!session && preview?.isRestDay) {
    return (
      <div className="container-page py-6">
        {header}
        <EmptyState
          icon={Moon}
          title="Rest day"
          description="There is no workout scheduled for today. Enjoy the recovery, or adjust the plan."
          action={
            <Link to={`/plan/${preview.day}`}>
              <Button>Open day plan</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (!session && preview) {
    return (
      <div className="container-page py-6">
        {header}
        <Card className="p-5 sm:p-7">
          <Badge variant="outline" className="border-primary/30 text-primary">
            Ready when you are
          </Badge>
          <h2 className="mt-3 text-xl font-semibold">
            {preview.muscles.map((group) => MUSCLE_LABELS[group.muscle]).join(' · ')}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {preview.plannedSets} planned sets across{' '}
            {preview.muscles.reduce((total, group) => total + group.exercises.length, 0)} exercises.
          </p>
          <div className="mt-5 space-y-2">
            {preview.muscles.map((group) => (
              <div key={group.muscle} className="rounded-xl border bg-muted/30 p-3">
                <p className="text-sm font-medium">{MUSCLE_LABELS[group.muscle]}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {group.exercises.map((exercise) => exercise.name).join(' · ')}
                </p>
              </div>
            ))}
          </div>
          <GradientButton
            size="lg"
            className="mt-6 w-full sm:w-auto"
            loading={start.isPending}
            onClick={() =>
              start.mutate(undefined, {
                onSuccess: () => toast.success('Workout started.'),
                onError: (apiError) => toast.error(getApiError(apiError).message)
              })
            }
          >
            <Play className="h-4 w-4" /> Start workout
          </GradientButton>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container-page py-6">
        {header}
        <EmptyState icon={Dumbbell} title="Nothing scheduled" description="Set up your weekly plan first." />
      </div>
    );
  }

  if (session.status === 'completed') {
    return (
      <div className="container-page py-6">
        {header}
        <Summary session={session} />
      </div>
    );
  }

  const onFinish = () => {
    finish.mutate(session._id, {
      onSuccess: () => {
        setConfirmFinish(false);
        toast.success('Workout saved.');
      },
      onError: (apiError) => toast.error(getApiError(apiError).message)
    });
  };

  return (
    <div className="container-page py-5 sm:py-6">
      {header}
      <SessionTimerBar session={session} date={date} />

      <Card className="mt-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Workout progress</p>
            <p className="text-xs text-muted-foreground">
              {session.completedSets} of {session.plannedSets} sets completed
            </p>
          </div>
          <p className="text-sm font-semibold">{session.completionPct}%</p>
        </div>
        <Progress value={session.completionPct} className="mt-3" label="Workout completion" />
      </Card>

      <div className="mt-4 space-y-4">
        {session.muscles.map((group) => (
          <section key={group.muscle} className="surface p-4">
            <h2 className="text-lg font-semibold">{MUSCLE_LABELS[group.muscle]}</h2>
            <ul className="mt-3 space-y-2">
              {group.exercises.map((exercise) => {
                const completedSets = exercise.sets.filter((set) => set.completed).length;
                return (
                  <li key={exercise.planExerciseId}>
                    <Link
                      to={`/workout/exercise/${exercise.planExerciseId}`}
                      className="flex min-h-[64px] items-center gap-3 rounded-xl border bg-background/50 px-3 py-2.5 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{exercise.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {completedSets}/{exercise.sets.length} sets
                          {exercise.sets.some((set) => set.tag === 'failure')
                            ? ' · failure set planned'
                            : ''}
                        </p>
                      </div>
                      <Badge variant={statusVariant(exercise.status)}>
                        {EXERCISE_STATUS_LABELS[exercise.status]}
                      </Badge>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {session.allExercisesCompleted ? (
        <Card className="mt-4 border-success/30 bg-success/5 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
            <div className="flex-1">
              <p className="font-semibold">Workout complete</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Every exercise is done. Finish to save your gym time.
              </p>
            </div>
          </div>
          <GradientButton className="mt-4 w-full" loading={finish.isPending} onClick={onFinish}>
            <Flag className="h-4 w-4" /> Finish &amp; save
          </GradientButton>
        </Card>
      ) : (
        <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 mt-5 lg:bottom-4">
          <Card className="border bg-background/95 p-3 shadow-lg backdrop-blur">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setConfirmFinish(true)}
              disabled={finish.isPending}
            >
              <Flag className="h-4 w-4" /> Finish workout
            </Button>
          </Card>
        </div>
      )}

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Timer className="h-3.5 w-3.5" /> Gym time is saved from the server timer.
      </p>

      <ConfirmDialog
        open={confirmFinish}
        onOpenChange={setConfirmFinish}
        title="Finish with unfinished sets?"
        description={`${session.plannedSets - session.completedSets} set${
          session.plannedSets - session.completedSets === 1 ? '' : 's'
        } are still open. Unfinished exercises will be marked skipped or partial.`}
        confirmLabel="Finish workout"
        pending={finish.isPending}
        onConfirm={onFinish}
      />
    </div>
  );
}
