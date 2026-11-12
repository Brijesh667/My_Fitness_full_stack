import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { ResponsiveSheet } from '@/components/ui/responsive-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SetsEditor } from '@/components/sets-editor';
import { useAddLibraryExercise } from '@/features/plan/api';
import { DAY_LABELS, MUSCLE_LABELS, type DayKey, type Muscle } from '@/lib/dates';
import { getApiError } from '@/lib/api';
import type { Exercise, SetTemplate } from '@/lib/types';

export function AddToPlanSheet({
  exercise,
  day,
  muscle,
  open,
  onOpenChange
}: {
  exercise: Exercise | null;
  day: DayKey;
  muscle?: Muscle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [sets, setSets] = useState<SetTemplate[]>([]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const add = useAddLibraryExercise(day);

  useEffect(() => {
    if (!exercise) return;
    setSets(exercise.sets?.length ? exercise.sets.map((set) => ({ ...set })) : [{ tag: 'normal', repetitions: 12 }]);
    setDescription(exercise.description ?? '');
    setError(null);
  }, [exercise, open]);

  if (!exercise) return null;

  const onSubmit = () => {
    setError(null);
    add.mutate(
      {
        exerciseId: exercise._id,
        overrides: {
          sets,
          ...(description ? { description } : {})
        },
        autoAddMuscle: true
      },
      {
        onSuccess: () => {
          toast.success(
            `Added to ${DAY_LABELS[day]}${muscle ? ` · ${MUSCLE_LABELS[muscle]}` : ''}.`
          );
          onOpenChange(false);
        },
        onError: (apiError) => {
          setError(getApiError(apiError).message);
        }
      }
    );
  };

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={exercise.name}
      description={`Adding to ${DAY_LABELS[day]}${muscle ? ` · ${MUSCLE_LABELS[muscle]}` : ''}`}
      footer={
        <Button className="w-full" onClick={onSubmit} disabled={add.isPending}>
          <Plus className="h-4 w-4" /> {add.isPending ? 'Adding…' : 'Add to plan'}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border bg-muted/30 p-3 text-sm">
          <p className="font-medium">{MUSCLE_LABELS[exercise.targetMuscle]}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            This is a copy — editing it later will not change the library exercise.
          </p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="plan-add-description" className="text-sm font-medium">
              Description
            </label>
            <span className="text-xs text-muted-foreground">{description.length}/100</span>
          </div>
          <Input
            id="plan-add-description"
            value={description}
            maxLength={100}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional plan-specific note"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Sets</p>
          <SetsEditor value={sets} onChange={setSets} />
        </div>

        {error ? (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </ResponsiveSheet>
  );
}
