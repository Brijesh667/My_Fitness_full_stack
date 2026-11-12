import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ChevronLeft,
  Dumbbell,
  Pencil,
  Plus,
  Sparkles,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveSheet } from '@/components/ui/responsive-sheet';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { MuscleChips } from '@/components/muscle-chips';
import { SetsEditor } from '@/components/sets-editor';
import { CustomExerciseSheet } from '@/features/exercises/CustomExerciseSheet';
import { DAY_KEYS, DAY_LABELS, MUSCLE_LABELS, type DayKey, type Muscle } from '@/lib/dates';
import type { PlanExercise, SetTemplate } from '@/lib/types';
import { getApiError } from '@/lib/api';
import {
  usePlan,
  useRemovePlanExercise,
  useSetMuscles,
  useUpdatePlanExercise
} from './api';

type PendingRemoval = { muscle: Muscle; next: Muscle[] } | null;

export default function DayEditorPage() {
  const { day: dayParam } = useParams();
  const day = (DAY_KEYS as readonly string[]).includes(dayParam ?? '')
    ? (dayParam as DayKey)
    : null;

  const planQuery = usePlan();
  const setMuscles = useSetMuscles(day ?? 'mon');
  const updateExercise = useUpdatePlanExercise(day ?? 'mon');
  const removeExercise = useRemovePlanExercise(day ?? 'mon');

  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval>(null);
  const [customMuscle, setCustomMuscle] = useState<Muscle | null>(null);
  const [editing, setEditing] = useState<PlanExercise | null>(null);
  const [deleting, setDeleting] = useState<PlanExercise | null>(null);

  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSets, setEditSets] = useState<SetTemplate[]>([]);
  const [editError, setEditError] = useState<string | null>(null);

  const planDay = planQuery.data?.days.find((entry) => entry.day === day);
  const selected = planDay?.muscles.map((group) => group.muscle) ?? [];

  useEffect(() => {
    if (!editing) return;
    setEditName(editing.name);
    setEditDescription(editing.description ?? '');
    setEditSets(editing.sets.map((set) => ({ ...set })));
    setEditError(null);
  }, [editing]);

  if (!day) {
    return (
      <div className="container-page py-8">
        <EmptyState
          icon={Dumbbell}
          title="Unknown day"
          description="That day is not part of the week."
          action={
            <Link to="/plan">
              <Button>Back to plan</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const saveMuscles = (muscles: Muscle[], confirm = false) => {
    setMuscles.mutate(
      { muscles, confirm },
      {
        onSuccess: () => toast.success('Plan updated.'),
        onError: (error) => toast.error(getApiError(error).message)
      }
    );
  };

  const toggleMuscle = (muscle: Muscle) => {
    const group = planDay?.muscles.find((entry) => entry.muscle === muscle);
    const isRemoving = selected.includes(muscle);

    if (!isRemoving && selected.length >= 4) {
      toast.error('A day can hold at most 4 muscles.');
      return;
    }

    const next = isRemoving ? selected.filter((item) => item !== muscle) : [...selected, muscle];

    if (isRemoving && group && group.exercises.length > 0) {
      setPendingRemoval({ muscle, next });
      return;
    }

    saveMuscles(next);
  };

  const onSaveEdit = () => {
    if (!editing) return;
    if (editName.trim().length < 2 || editName.trim().length > 50) {
      setEditError('Name must be 2–50 characters.');
      return;
    }
    updateExercise.mutate(
      {
        planExerciseId: editing._id,
        name: editName.trim(),
        description: editDescription.trim(),
        sets: editSets
      },
      {
        onSuccess: () => {
          toast.success('Exercise updated.');
          setEditing(null);
        },
        onError: (error) => setEditError(getApiError(error).message)
      }
    );
  };

  if (planQuery.isLoading) {
    return (
      <div className="container-page space-y-4 py-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (planQuery.isError) {
    return (
      <div className="container-page py-6">
        <ErrorState error={planQuery.error} onRetry={() => planQuery.refetch()} />
      </div>
    );
  }

  return (
    <div className="container-page py-5 sm:py-8">
      <Link to="/plan" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Weekly plan
      </Link>

      <header className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">{DAY_LABELS[day]}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {selected.length
              ? `${selected.length} ${selected.length === 1 ? 'muscle' : 'muscles'} selected`
              : 'No muscles yet — this is a rest day.'}
          </p>
        </div>
        {planDay?.muscles.length ? (
          <Badge variant="muted">
            {planDay.muscles.reduce((total, group) => total + group.exercises.length, 0)} exercise
            {planDay.muscles.reduce((total, group) => total + group.exercises.length, 0) === 1 ? '' : 's'}
          </Badge>
        ) : null}
      </header>

      <Card className="mt-5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Step 1 · Target muscles</p>
            <p className="text-xs text-muted-foreground">Choose up to four.</p>
          </div>
          {selected.length === 4 ? <Badge variant="warning">Max 4 selected</Badge> : null}
        </div>
        <div className="mt-3">
          <MuscleChips
            selected={selected}
            onToggle={toggleMuscle}
            max={4}
            disabled={setMuscles.isPending}
          />
        </div>
      </Card>

      {selected.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={Sparkles}
          title="Pick a muscle to start"
          description="Exercises are organised under the muscle they train. Add a muscle above, then add exercises."
        />
      ) : (
        <div className="mt-5 space-y-4">
          {planDay?.muscles.map((group) => (
            <section key={group.muscle} className="surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{MUSCLE_LABELS[group.muscle]}</h2>
                  <Badge variant="muted">{group.exercises.length}</Badge>
                </div>
                <div className="flex gap-2">
                  <Link to={`/exercises?muscle=${group.muscle}&day=${day}&mode=add`}>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4" /> Add exercise
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => setCustomMuscle(group.muscle)}>
                    Add my own
                  </Button>
                </div>
              </div>

              {group.exercises.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed p-6 text-center">
                  <p className="text-sm font-medium">No exercises yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add one from the library or create your own.
                  </p>
                  <Link to={`/exercises?muscle=${group.muscle}&day=${day}&mode=add`} className="mt-3 inline-block">
                    <Button size="sm" variant="outline">
                      <Dumbbell className="h-4 w-4" /> Browse {MUSCLE_LABELS[group.muscle]}
                    </Button>
                  </Link>
                </div>
              ) : (
                <ul className="mt-3 space-y-2">
                  {group.exercises.map((exercise) => (
                    <li
                      key={exercise._id}
                      className="flex items-start gap-3 rounded-xl border bg-background/50 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{exercise.name}</p>
                          {exercise.isCustom ? <Badge variant="muted">Custom</Badge> : null}
                        </div>
                        {exercise.description ? (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {exercise.description}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {exercise.sets.length} set{exercise.sets.length === 1 ? '' : 's'} ·{' '}
                          {exercise.sets.map((set) => set.repetitions).join('/')} reps
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${exercise.name}`}
                          onClick={() => setEditing(exercise)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${exercise.name}`}
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleting(exercise)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingRemoval)}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null);
        }}
        title={`Remove ${pendingRemoval ? MUSCLE_LABELS[pendingRemoval.muscle] : ''}?`}
        description="This muscle has exercises. Removing it will also remove them from this day."
        confirmLabel="Remove muscle"
        destructive
        pending={setMuscles.isPending}
        onConfirm={() => {
          if (!pendingRemoval) return;
          saveMuscles(pendingRemoval.next, true);
          setPendingRemoval(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Remove ${deleting?.name ?? 'exercise'}?`}
        description="The library copy stays untouched."
        confirmLabel="Remove exercise"
        destructive
        pending={removeExercise.isPending}
        onConfirm={() => {
          if (!deleting) return;
          removeExercise.mutate(deleting._id, {
            onSuccess: () => {
              toast.success('Exercise removed.');
              setDeleting(null);
            },
            onError: (error) => toast.error(getApiError(error).message)
          });
        }}
      />

      <ResponsiveSheet
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={editing ? `Edit ${editing.name}` : 'Edit exercise'}
        description="Changes apply to this plan only."
        footer={
          <Button className="w-full" onClick={onSaveEdit} disabled={updateExercise.isPending}>
            {updateExercise.isPending ? 'Saving…' : 'Save exercise'}
          </Button>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="plan-exercise-name" className="mb-1.5 block text-sm font-medium">
              Name
            </label>
            <Input
              id="plan-exercise-name"
              value={editName}
              maxLength={50}
              onChange={(event) => setEditName(event.target.value)}
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="plan-exercise-description" className="text-sm font-medium">
                Description
              </label>
              <span className="text-xs text-muted-foreground">{editDescription.length}/100</span>
            </div>
            <Input
              id="plan-exercise-description"
              value={editDescription}
              maxLength={100}
              onChange={(event) => setEditDescription(event.target.value)}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Sets</p>
            <SetsEditor value={editSets} onChange={setEditSets} />
          </div>
          {editError ? (
            <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {editError}
            </p>
          ) : null}
        </div>
      </ResponsiveSheet>

      {customMuscle ? (
        <CustomExerciseSheet
          open={Boolean(customMuscle)}
          onOpenChange={(open) => {
            if (!open) setCustomMuscle(null);
          }}
          day={day}
          lockedMuscle={customMuscle}
        />
      ) : null}
    </div>
  );
}
