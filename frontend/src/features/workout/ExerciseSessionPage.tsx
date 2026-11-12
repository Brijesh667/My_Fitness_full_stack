import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Flag,
  Info,
  RotateCcw,
  SkipForward
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { ConfirmDialog } from '@/components/confirm-dialog';
import {
  EXERCISE_STATUS_LABELS,
  MUSCLE_LABELS,
  todayKey
} from '@/lib/dates';
import { getApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  useSkipExercise,
  useStartExercise,
  useToday,
  useUpdateSet
} from './api';
import { SessionTimerBar } from './SessionTimerBar';

interface Draft {
  weight: string;
  reps: string;
}

export default function ExerciseSessionPage() {
  const { planExerciseId } = useParams();
  const date = todayKey();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useToday(date);
  const startExercise = useStartExercise(date);
  const updateSet = useUpdateSet(date);
  const skip = useSkipExercise(date);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const autoStarted = useRef<string | null>(null);

  const session = data?.session ?? null;
  const group = session?.muscles.find((entry) =>
    entry.exercises.some((exercise) => exercise.planExerciseId === planExerciseId)
  );
  const exercise = group?.exercises.find((entry) => entry.planExerciseId === planExerciseId);

  useEffect(() => {
    if (!session || !exercise || !planExerciseId) return;
    if (session.status !== 'in_progress' || exercise.status !== 'pending') return;

    const key = `${session._id}:${planExerciseId}`;
    if (autoStarted.current === key) return;
    autoStarted.current = key;

    startExercise.mutate(
      { sessionId: session._id, planExerciseId },
      { onError: (apiError) => toast.error(getApiError(apiError).message) }
    );
    // Only auto-start once per exercise.
  }, [session?._id, exercise?.status, planExerciseId]);

  const draftFor = (index: number, weightKg?: number, actualReps?: number): Draft =>
    drafts[index] ?? {
      weight: weightKg !== undefined ? String(weightKg) : '',
      reps: actualReps !== undefined ? String(actualReps) : ''
    };

  const updateDraft = (index: number, patch: Partial<Draft>, weightKg?: number, actualReps?: number) => {
    const current = draftFor(index, weightKg, actualReps);
    setDrafts((previous) => ({ ...previous, [index]: { ...current, ...patch } }));
  };

  const parsedValues = (index: number, weightKg?: number, actualReps?: number) => {
    const draft = draftFor(index, weightKg, actualReps);
    const weight = draft.weight.trim() === '' ? undefined : Number(draft.weight);
    const reps = draft.reps.trim() === '' ? undefined : Number(draft.reps);

    if (weight !== undefined) {
      if (!Number.isFinite(weight) || weight < 0 || weight > 1000 || !Number.isInteger(weight * 2)) {
        return { error: 'Weight must be between 0 and 1000 kg in 0.5 kg steps.' };
      }
    }
    if (reps !== undefined) {
      if (!Number.isInteger(reps) || reps < 0 || reps > 1000) {
        return { error: 'Actual reps must be a whole number between 0 and 1000.' };
      }
    }
    return { weight, reps };
  };

  const toggleSet = (index: number, weightKg?: number, actualReps?: number) => {
    if (!session || !exercise) return;
    const set = exercise.sets[index];
    const values = parsedValues(index, weightKg, actualReps);
    if (values.error) {
      toast.error(values.error);
      return;
    }

    updateSet.mutate(
      {
        sessionId: session._id,
        planExerciseId: exercise.planExerciseId,
        setIndex: index,
        completed: !set.completed,
        ...(values.weight !== undefined ? { weightKg: values.weight } : {}),
        ...(values.reps !== undefined ? { actualReps: values.reps } : {})
      },
      {
        onSuccess: (result) => {
          const updated = result.session.muscles
            .flatMap((entry) => entry.exercises)
            .find((entry) => entry.planExerciseId === exercise.planExerciseId);
          if (set.completed && updated?.status !== 'completed') {
            toast.success('Set reopened.');
          }
          if (!set.completed && updated?.status === 'completed') {
            toast.success('Exercise complete.');
            window.setTimeout(() => navigate('/workout'), 700);
          }
        },
        onError: (apiError) => toast.error(getApiError(apiError).message)
      }
    );
  };

  const persistValues = (index: number, weightKg?: number, actualReps?: number) => {
    if (!session || !exercise) return;
    const set = exercise.sets[index];
    if (!set.completed) return;
    const values = parsedValues(index, weightKg, actualReps);
    if (values.error) {
      toast.error(values.error);
      return;
    }
    updateSet.mutate(
      {
        sessionId: session._id,
        planExerciseId: exercise.planExerciseId,
        setIndex: index,
        completed: true,
        ...(values.weight !== undefined ? { weightKg: values.weight } : {}),
        ...(values.reps !== undefined ? { actualReps: values.reps } : {})
      },
      { onError: (apiError) => toast.error(getApiError(apiError).message) }
    );
  };

  if (isLoading) {
    return (
      <div className="container-page space-y-4 py-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
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

  if (!session) {
    return (
      <div className="container-page py-6">
        <EmptyState
          icon={Info}
          title="No workout in progress"
          description="Start today’s workout from the workout page."
          action={
            <Link to="/workout">
              <Button>Go to workout</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="container-page py-6">
        <EmptyState
          icon={Info}
          title="Exercise not found"
          description="This exercise is not part of today’s session."
          action={
            <Link to="/workout">
              <Button>Back to workout</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (session.status === 'completed') {
    return (
      <div className="container-page py-6">
        <EmptyState
          icon={Check}
          title="Workout finished"
          description="This session is already saved."
          action={
            <Link to="/workout">
              <Button>View summary</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-5 sm:py-6">
      <Link to="/workout" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Workout
      </Link>

      <header className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {group ? MUSCLE_LABELS[group.muscle] : 'Exercise'}
          </p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{exercise.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {exercise.sets.length} set{exercise.sets.length === 1 ? '' : 's'} ·{' '}
            {exercise.sets.filter((set) => set.completed).length} completed
          </p>
        </div>
        <Badge variant={exercise.status === 'completed' ? 'success' : 'warning'}>
          {EXERCISE_STATUS_LABELS[exercise.status]}
        </Badge>
      </header>

      <div className="mt-4">
        <SessionTimerBar session={session} date={date} />
      </div>

      <div className="mt-4 space-y-2.5">
        {exercise.sets.map((set, index) => {
          const draft = draftFor(index, set.weightKg, set.actualReps);
          const isExpanded = expanded === index;
          const summary =
            set.weightKg !== undefined || set.actualReps !== undefined
              ? [set.weightKg !== undefined ? `${set.weightKg} kg` : null, set.actualReps !== undefined ? `${set.actualReps} reps` : null]
                  .filter(Boolean)
                  .join(' × ')
              : null;

          return (
            <Card
              key={index}
              className={cn(
                'overflow-hidden p-0 transition-colors',
                set.completed && 'border-success/35 bg-success/5'
              )}
            >
              <div className="flex items-center gap-3 p-3.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={set.completed}
                  aria-label={`Mark set ${index + 1} ${set.completed ? 'incomplete' : 'complete'}`}
                  onClick={() => toggleSet(index, set.weightKg, set.actualReps)}
                  disabled={updateSet.isPending || startExercise.isPending || exercise.status === 'pending'}
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 transition-colors',
                    set.completed
                      ? 'border-success bg-success text-zinc-950'
                      : 'border-input bg-background text-transparent hover:border-primary'
                  )}
                >
                  <Check className="h-5 w-5" strokeWidth={3} />
                </button>

                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  aria-expanded={isExpanded}
                  onClick={() => setExpanded(isExpanded ? null : index)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">Set {index + 1}</span>
                    {set.tag === 'failure' ? <Badge variant="warning">Failure</Badge> : null}
                    {set.completed ? <Badge variant="success">Done</Badge> : null}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Planned {set.plannedReps} reps{summary ? ` · ${summary}` : ''}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : index)}
                  aria-label={`${isExpanded ? 'Hide' : 'Show'} weight and actual reps for set ${index + 1}`}
                  aria-expanded={isExpanded}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
                >
                  <ChevronDown className={cn('h-5 w-5 transition-transform', isExpanded && 'rotate-180')} />
                </button>
              </div>

              {isExpanded ? (
                <div className="border-t bg-background/40 p-3.5 pt-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`weight-${index}`} className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        Weight (kg, optional)
                      </label>
                      <Input
                        id={`weight-${index}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={1000}
                        step={0.5}
                        placeholder="0"
                        value={draft.weight}
                        onChange={(event) =>
                          updateDraft(index, { weight: event.target.value }, set.weightKg, set.actualReps)
                        }
                        onBlur={() => persistValues(index, set.weightKg, set.actualReps)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`reps-${index}`} className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        Actual reps (optional)
                      </label>
                      <Input
                        id={`reps-${index}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={1000}
                        step={1}
                        placeholder={String(set.plannedReps)}
                        value={draft.reps}
                        onChange={(event) =>
                          updateDraft(index, { reps: event.target.value }, set.weightKg, set.actualReps)
                        }
                        onBlur={() => persistValues(index, set.weightKg, set.actualReps)}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Values save on blur after the set is completed.
                  </p>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        {exercise.status === 'completed' ? (
          <Link to="/workout" className="flex-1">
            <Button className="w-full" variant="secondary">
              <RotateCcw className="h-4 w-4" /> Back to workout
            </Button>
          </Link>
        ) : null}
        <Button
          variant="outline"
          className="flex-1 text-muted-foreground hover:text-destructive"
          onClick={() => setConfirmSkip(true)}
          disabled={skip.isPending}
        >
          <SkipForward className="h-4 w-4" /> Skip this exercise
        </Button>
      </div>

      <ConfirmDialog
        open={confirmSkip}
        onOpenChange={setConfirmSkip}
        title={`Skip ${exercise.name}?`}
        description="Completed sets for this exercise will be cleared and it will be marked skipped."
        confirmLabel="Skip exercise"
        destructive
        pending={skip.isPending}
        onConfirm={() => {
          if (!session) return;
          skip.mutate(
            { sessionId: session._id, planExerciseId: exercise.planExerciseId },
            {
              onSuccess: () => {
                setConfirmSkip(false);
                toast.success('Exercise skipped.');
                navigate('/workout');
              },
              onError: (apiError) => toast.error(getApiError(apiError).message)
            }
          );
        }}
      />

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Flag className="h-3.5 w-3.5" /> Finish the whole workout from the workout page.
      </p>
    </div>
  );
}
