import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MUSCLE_LABELS } from '@/lib/dates';
import type { Exercise } from '@/lib/types';
import { Plus } from 'lucide-react';

export function ExerciseCard({
  exercise,
  onDetails,
  onAdd
}: {
  exercise: Exercise;
  onDetails: () => void;
  onAdd?: () => void;
}) {
  const reps = exercise.sets.map((set) => set.repetitions);
  const repLabel = reps.length ? `${exercise.sets.length} sets · ${reps[0]} reps` : 'No sets';

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <Badge variant="default">{MUSCLE_LABELS[exercise.targetMuscle]}</Badge>
        {exercise.isCustom ? <Badge variant="muted">Mine</Badge> : null}
      </div>

      <button type="button" onClick={onDetails} className="mt-3 text-left">
        <h3 className="font-semibold leading-snug hover:text-primary">{exercise.name}</h3>
      </button>

      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
        {exercise.description || 'No description yet.'}
      </p>

      <p className="mt-2 text-xs text-muted-foreground">{repLabel}</p>

      <div className="mt-auto flex gap-2 pt-4">
        <Button variant="outline" size="sm" className="flex-1" onClick={onDetails}>
          Details
        </Button>
        {onAdd ? (
          <Button size="sm" className="flex-1" onClick={onAdd}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
