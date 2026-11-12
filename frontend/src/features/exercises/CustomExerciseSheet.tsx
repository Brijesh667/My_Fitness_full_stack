import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { ResponsiveSheet } from '@/components/ui/responsive-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Field } from '@/components/form-field';
import { SetsEditor } from '@/components/sets-editor';
import { useCreateExercise } from '@/features/exercises/api';
import { apiPost } from '@/lib/api';
import { DAY_LABELS, MUSCLES, MUSCLE_LABELS, type DayKey, type Muscle } from '@/lib/dates';
import { exerciseFormSchema, type ExerciseFormValues } from '@/lib/schemas/exercise';
import { getApiError } from '@/lib/api';

export function CustomExerciseSheet({
  open,
  onOpenChange,
  day,
  lockedMuscle
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day?: DayKey;
  lockedMuscle?: Muscle;
}) {
  const queryClient = useQueryClient();
  const createExercise = useCreateExercise();
  const [alsoSave, setAlsoSave] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: '',
      targetMuscle: lockedMuscle ?? 'chest',
      description: '',
      sets: [{ tag: 'normal', repetitions: 12 }],
      links: []
    }
  });

  const links = useFieldArray({ control, name: 'links' });
  const description = watch('description') ?? '';

  useEffect(() => {
    if (!open) return;
    reset({
      name: '',
      targetMuscle: lockedMuscle ?? 'chest',
      description: '',
      sets: [{ tag: 'normal', repetitions: 12 }],
      links: []
    });
    setServerError(null);
    setAlsoSave(true);
  }, [open, lockedMuscle, reset]);

  const planMutation = useMutation({
    mutationFn: (values: ExerciseFormValues) =>
      apiPost<{ plan: unknown; day: unknown }>(`/plan/days/${day}/exercises`, {
        custom: {
          name: values.name,
          ...(values.description ? { description: values.description } : {}),
          sets: values.sets,
          links: values.links
        },
        targetMuscle: values.targetMuscle,
        saveToLibrary: alsoSave
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan'] });
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    }
  });

  const onSubmit = (values: ExerciseFormValues) => {
    setServerError(null);
    const onError = (error: unknown) => setServerError(getApiError(error).message);

    if (day) {
      planMutation.mutate(values, {
        onSuccess: () => {
          toast.success(
            `Added to ${DAY_LABELS[day]}${lockedMuscle ? ` · ${MUSCLE_LABELS[lockedMuscle]}` : ''}.`
          );
          onOpenChange(false);
        },
        onError
      });
      return;
    }

    createExercise.mutate(
      {
        name: values.name,
        targetMuscle: values.targetMuscle,
        ...(values.description ? { description: values.description } : {}),
        sets: values.sets,
        links: values.links
      },
      {
        onSuccess: () => {
          toast.success('Exercise saved to your library.');
          onOpenChange(false);
        },
        onError
      }
    );
  };

  const pending = planMutation.isPending || createExercise.isPending;

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={day ? 'Add my own exercise' : 'New custom exercise'}
      description={
        day && lockedMuscle
          ? `Saving to ${DAY_LABELS[day]} · ${MUSCLE_LABELS[lockedMuscle]}`
          : 'Saved to your personal library only.'
      }
      footer={
        <Button type="submit" form="custom-exercise-form" className="w-full" disabled={pending}>
          {pending ? 'Saving…' : day ? 'Add to plan' : 'Save exercise'}
        </Button>
      }
    >
      <form id="custom-exercise-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Name" htmlFor="custom-name" error={errors.name?.message}>
          <Input
            id="custom-name"
            placeholder="e.g. Band chest press"
            maxLength={50}
            {...register('name')}
          />
        </Field>

        <Field
          label="Target muscle"
          htmlFor="custom-muscle"
          error={errors.targetMuscle?.message}
          hint={lockedMuscle ? 'Locked to the muscle group you are editing.' : undefined}
        >
          <Select id="custom-muscle" disabled={Boolean(lockedMuscle)} {...register('targetMuscle')}>
            {MUSCLES.map((muscle) => (
              <option key={muscle} value={muscle}>
                {MUSCLE_LABELS[muscle]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Description" htmlFor="custom-description" error={errors.description?.message}>
          <Input
            id="custom-description"
            placeholder="Optional, up to 100 characters"
            maxLength={100}
            {...register('description')}
          />
          <p className="text-right text-xs text-muted-foreground">{description.length}/100</p>
        </Field>

        <div>
          <Label>Sets</Label>
          <div className="mt-2">
            <Controller
              control={control}
              name="sets"
              render={({ field, fieldState }) => (
                <SetsEditor value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
              )}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label>Links (optional)</Label>
            {links.fields.length < 5 ? (
              <Button variant="ghost" size="sm" type="button" onClick={() => links.append({ label: '', url: '' })}>
                <Plus className="h-4 w-4" /> Add link
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Max 5</span>
            )}
          </div>

          <div className="mt-2 space-y-2">
            {links.fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 rounded-xl border p-2 sm:grid-cols-[1fr_2fr_auto]">
                <Input placeholder="Label" maxLength={40} {...register(`links.${index}.label`)} />
                <Input placeholder="https://…" {...register(`links.${index}.url`)} />
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  aria-label={`Remove link ${index + 1}`}
                  onClick={() => links.remove(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {errors.links?.[index]?.url?.message ? (
                  <p className="text-xs text-destructive sm:col-span-3">{errors.links[index]?.url?.message}</p>
                ) : null}
              </div>
            ))}
            {links.fields.length === 0 ? (
              <p className="text-xs text-muted-foreground">No links yet. Add a form video if you like.</p>
            ) : null}
          </div>
        </div>

        {day ? (
          <label className="flex items-center gap-2 rounded-xl border bg-muted/30 p-3 text-sm">
            <input
              type="checkbox"
              checked={alsoSave}
              onChange={(event) => setAlsoSave(event.target.checked)}
              className="h-4 w-4 accent-[hsl(var(--primary))]"
            />
            Also save to my library
          </label>
        ) : null}

        {serverError ? (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        ) : null}
      </form>
    </ResponsiveSheet>
  );
}
