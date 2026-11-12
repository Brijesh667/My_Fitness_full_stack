import { useEffect, useState } from 'react';
import { ChevronDown, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { SetTemplate } from '@/lib/types';

const DEFAULT_SET: SetTemplate = { tag: 'normal', repetitions: 12 };

function RepsField({
  value,
  onChange,
  label
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    if (Number(draft) !== value) setDraft(String(value));
    // Only react to outside changes; typing keeps the raw draft.
  }, [value]);

  const commit = () => {
    const parsed = Math.min(1000, Math.max(1, Math.trunc(Number(draft) || 1)));
    setDraft(String(parsed));
    onChange(parsed);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label="Decrease repetitions"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        aria-label={label}
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        onChange={(event) => {
          const raw = event.target.value.replace(/[^0-9]/g, '');
          setDraft(raw);
          const parsed = Number(raw);
          if (parsed >= 1 && parsed <= 1000) onChange(parsed);
        }}
        onBlur={commit}
        className="w-20 text-center text-base font-medium"
      />
      <Button
        variant="outline"
        size="icon"
        aria-label="Increase repetitions"
        onClick={() => onChange(Math.min(1000, value + 1))}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function SetsEditor({
  value,
  onChange,
  error,
  disabled = false
}: {
  value: SetTemplate[];
  onChange: (sets: SetTemplate[]) => void;
  error?: string;
  disabled?: boolean;
}) {
  const sets = value.length ? value : [DEFAULT_SET];
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active > sets.length - 1) setActive(Math.max(0, sets.length - 1));
  }, [sets.length, active]);

  const update = (index: number, patch: Partial<SetTemplate>) => {
    onChange(sets.map((set, setIndex) => (setIndex === index ? { ...set, ...patch } : set)));
  };

  const addSet = () => {
    if (sets.length >= 10) return;
    const previous = sets[sets.length - 1] ?? DEFAULT_SET;
    onChange([
      ...sets,
      {
        tag: previous.tag,
        repetitions: previous.repetitions,
        ...(previous.description ? { description: previous.description } : {})
      }
    ]);
    setActive(sets.length);
  };

  const removeSet = (index: number) => {
    if (sets.length <= 1) return;
    const next = sets.filter((_, setIndex) => setIndex !== index);
    onChange(next);
    setActive(Math.max(0, Math.min(active, next.length - 1)));
  };

  return (
    <div className="space-y-2">
      {sets.map((set, index) => {
        const isActive = index === active;
        const summary = `Set ${index + 1} · ${set.tag === 'failure' ? 'Failure' : 'Normal'} · ${
          set.repetitions
        } reps`;

        if (!isActive) {
          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => setActive(index)}
              aria-expanded={false}
              className="flex min-h-11 w-full items-center justify-between rounded-xl border bg-muted/30 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60"
            >
              <span>{summary}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
            </button>
          );
        }

        return (
          <div key={index} className="rounded-xl border bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Set {index + 1}</p>
              {sets.length > 1 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-destructive"
                  onClick={() => removeSet(index)}
                  disabled={disabled}
                  aria-label={`Remove set ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Tag</p>
                <div className="inline-flex rounded-lg border bg-muted/40 p-1" role="group" aria-label="Set type">
                  {(['normal', 'failure'] as const).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={set.tag === tag}
                      disabled={disabled}
                      onClick={() => update(index, { tag })}
                      className={cn(
                        'h-8 rounded-md px-3 text-xs font-medium transition-colors',
                        set.tag === tag
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {tag === 'normal' ? 'Normal' : 'Failure'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor={`set-description-${index}`}
                  className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground"
                >
                  <span>Note (optional)</span>
                  <span>{(set.description ?? '').length}/100</span>
                </label>
                <Input
                  id={`set-description-${index}`}
                  value={set.description ?? ''}
                  maxLength={100}
                  disabled={disabled}
                  placeholder="e.g. slow eccentric"
                  onChange={(event) => update(index, { description: event.target.value })}
                  className="h-10"
                />
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Repetitions</p>
                <RepsField
                  value={set.repetitions}
                  onChange={(repetitions) => update(index, { repetitions })}
                  label={`Set ${index + 1} repetitions`}
                />
              </div>
            </div>
          </div>
        );
      })}

      <Button
        variant="outline"
        className="w-full"
        onClick={addSet}
        disabled={disabled || sets.length >= 10}
      >
        <Plus className="h-4 w-4" /> Add set
      </Button>
      {sets.length >= 10 ? (
        <p className="text-center text-xs text-muted-foreground">Max 10 sets</p>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Only the active set is expanded. Tap another to edit it.
        </p>
      )}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
