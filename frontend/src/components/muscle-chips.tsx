import { Check } from 'lucide-react';
import { MUSCLES, MUSCLE_LABELS, type Muscle } from '@/lib/dates';
import { cn } from '@/lib/utils';

export function MuscleChips({
  selected,
  onToggle,
  max,
  disabled = false
}: {
  selected: Muscle[];
  onToggle: (muscle: Muscle) => void;
  max?: number;
  disabled?: boolean;
}) {
  const atLimit = max !== undefined && selected.length >= max;

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Muscles">
      {MUSCLES.map((muscle) => {
        const isSelected = selected.includes(muscle);
        const isDisabled = disabled || (!isSelected && atLimit);
        return (
          <button
            key={muscle}
            type="button"
            aria-pressed={isSelected}
            disabled={isDisabled}
            title={isDisabled && !isSelected && max ? `Maximum ${max} muscles per day` : undefined}
            onClick={() => onToggle(muscle)}
            className={cn(
              'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
              isSelected
                ? 'border-primary/40 bg-primary/15 text-primary'
                : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
              isDisabled && !isSelected && 'cursor-not-allowed opacity-40 hover:bg-background hover:text-muted-foreground'
            )}
          >
            {isSelected ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
            {MUSCLE_LABELS[muscle]}
          </button>
        );
      })}
    </div>
  );
}
