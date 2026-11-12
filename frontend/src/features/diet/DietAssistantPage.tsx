import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AlertTriangle, ChevronLeft, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { GradientButton } from '@/components/ui/gradient-button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/form-field';
import { ConfirmDialog } from '@/components/confirm-dialog';
import {
  DAY_KEYS,
  DAY_LABELS,
  DIET_LABELS,
  GOAL_LABELS,
  MEAL_LABELS,
  MEAL_TYPES,
  dayKeyFromDateKey,
  todayKey,
  type DayKey
} from '@/lib/dates';
import { assistantFormSchema, type AssistantFormValues } from '@/lib/schemas/diet';
import { getApiError } from '@/lib/api';
import { cn, formatNumber, formatResetTime, formatWait } from '@/lib/utils';
import type { AssistantResult, DietMeal, DietPlan } from '@/lib/types';
import { useMe } from '@/features/auth/api';
import { useAssistantUsage, useDietPlan, useGenerateDiet, useUpsertDietPlan } from './api';

function planPayload(plan: DietPlan) {
  return {
    name: plan.name,
    goal: plan.goal,
    dailyTargets: plan.dailyTargets,
    days: plan.days.map((day) => ({
      day: day.day,
      meals: day.meals.map((meal) => ({
        ...(meal._id ? { _id: meal._id } : {}),
        type: meal.type,
        ...(meal.time ? { time: meal.time } : {}),
        ...(meal.notes ? { notes: meal.notes } : {}),
        items: meal.items
      }))
    })),
    source: plan.source,
    citations: plan.citations
  };
}

function mealCalories(meal: DietMeal) {
  return meal.items.reduce((sum, item) => sum + item.calories, 0);
}

export default function DietAssistantPage() {
  const navigate = useNavigate();
  const { data: user } = useMe();
  const planQuery = useDietPlan();
  const usageQuery = useAssistantUsage();
  const generate = useGenerateDiet();
  const savePlan = useUpsertDietPlan();
  const usage = usageQuery.data;
  const limitReached = Boolean(usage && usage.remaining <= 0);

  const today = todayKey();
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewDay, setPreviewDay] = useState<DayKey>('mon');
  const [confirmReplace, setConfirmReplace] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<AssistantFormValues>({
    resolver: zodResolver(assistantFormSchema),
    defaultValues: {
      mode: 'plan',
      goal: user?.profile?.goal ?? 'maintain',
      mealsPerDay: 4,
      dietPreference: user?.profile?.dietPreference ?? 'veg',
      allergiesText: '',
      cuisine: '',
      notes: '',
      day: dayKeyFromDateKey(today),
      mealType: 'lunch'
    }
  });

  const mode = watch('mode');
  const notes = watch('notes') ?? '';
  const allergiesText = watch('allergiesText') ?? '';

  const onSubmit = (values: AssistantFormValues) => {
    setError(null);
    setResult(null);
    const allergies = allergiesText
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 10);

    generate.mutate(
      {
        mode: values.mode,
        goal: values.goal,
        mealsPerDay: values.mealsPerDay,
        dietPreference: values.dietPreference,
        allergies,
        ...(values.cuisine ? { cuisine: values.cuisine } : {}),
        ...(values.notes ? { notes: values.notes } : {}),
        ...(values.mode === 'meal' ? { day: values.day, mealType: values.mealType } : {})
      },
      {
        onSuccess: (data) => {
          setResult(data);
          if (data.plan) setPreviewDay('mon');
          toast.success('Draft generated. Review it before adding.');
        },
        onError: (apiError) => {
          const normalised = getApiError(apiError);
          if (normalised.code === 'RATE_LIMITED') {
            setError(
              `Daily limit reached. Try again in ${formatWait(normalised.retryAfterSec ?? 60)}.`
            );
          } else if (normalised.code === 'REQUEST_TIMEOUT') {
            setError('The assistant took too long to respond. Please try again.');
          } else if (normalised.code === 'AI_INVALID_OUTPUT') {
            setError('The assistant returned an invalid draft. Please try again.');
          } else {
            setError(normalised.message);
          }
        }
      }
    );
  };

  const existingPlan = planQuery.data ?? null;

  const adoptPlan = () => {
    if (!result?.plan) return;
    savePlan.mutate(
      {
        name: 'Assistant plan',
        goal: watch('goal'),
        dailyTargets: result.plan.dailyTargets,
        days: result.plan.days,
        source: 'ai',
        citations: result.plan.citations
      },
      {
        onSuccess: () => {
          setConfirmReplace(false);
          toast.success('Assistant plan added to your diet.');
          navigate('/diet/plan');
        },
        onError: (apiError) => toast.error(getApiError(apiError).message)
      }
    );
  };

  const mealDay = (watch('day') ?? dayKeyFromDateKey(today)) as DayKey;

  const adoptMeal = () => {
    if (!result?.meal || !existingPlan) return;
    const base = planPayload(existingPlan);
    const target = base.days.find((day) => day.day === mealDay);
    if (!target) return;
    if (target.meals.length >= 8) {
      toast.error('That day already has 8 meals.');
      return;
    }
    target.meals.push(result.meal);

    savePlan.mutate(
      { ...base, source: 'manual' },
      {
        onSuccess: () => {
          toast.success(`Meal added to ${DAY_LABELS[mealDay]}.`);
          navigate('/diet');
        },
        onError: (apiError) => toast.error(getApiError(apiError).message)
      }
    );
  };

  const previewMeals = result?.plan?.days.find((day) => day.day === previewDay)?.meals ?? [];

  return (
    <div className="container-page py-5 sm:py-8">
      <Link to="/diet" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Today’s diet
      </Link>

      <header className="mt-2 mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold sm:text-3xl">Diet assistant</h1>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Generate a structured plan or one meal from the local knowledge base. Review it first —
          you choose whether to add it.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit p-4 sm:p-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <p className="mb-1.5 text-sm font-medium">What do you need?</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['plan', 'A full plan'],
                    ['meal', 'One meal']
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('mode', value)}
                    aria-pressed={mode === value}
                    className={cn(
                      'min-h-11 rounded-xl border text-sm font-medium transition-colors',
                      mode === value
                        ? 'border-primary/40 bg-primary/12 text-primary'
                        : 'bg-background text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Goal" htmlFor="assistant-goal" error={errors.goal?.message}>
              <Select id="assistant-goal" {...register('goal')}>
                {Object.entries(GOAL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Meals per day"
              htmlFor="assistant-meals"
              error={errors.mealsPerDay?.message}
            >
              <Select id="assistant-meals" {...register('mealsPerDay')}>
                {[3, 4, 5, 6].map((value) => (
                  <option key={value} value={value}>
                    {value} meals
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Diet preference"
              htmlFor="assistant-preference"
              error={errors.dietPreference?.message}
            >
              <Select id="assistant-preference" {...register('dietPreference')}>
                {Object.entries(DIET_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Allergies"
              htmlFor="assistant-allergies"
              error={errors.allergiesText?.message}
              hint="Comma separated, up to 10 items."
            >
              <Input
                id="assistant-allergies"
                placeholder="peanuts, dairy"
                maxLength={300}
                {...register('allergiesText')}
              />
              <p className="text-right text-[10px] text-muted-foreground">{allergiesText.length}/300</p>
            </Field>

            <Field label="Cuisine" htmlFor="assistant-cuisine" error={errors.cuisine?.message}>
              <Input id="assistant-cuisine" placeholder="e.g. indian" maxLength={30} {...register('cuisine')} />
            </Field>

            {mode === 'meal' ? (
              <div className="grid grid-cols-2 gap-2">
                <Field label="Day" htmlFor="assistant-day" error={errors.day?.message}>
                  <Select id="assistant-day" {...register('day')}>
                    {DAY_KEYS.map((day) => (
                      <option key={day} value={day}>
                        {DAY_LABELS[day]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Meal" htmlFor="assistant-meal-type" error={errors.mealType?.message}>
                  <Select id="assistant-meal-type" {...register('mealType')}>
                    {MEAL_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {MEAL_LABELS[type]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            ) : null}

            <Field label="Notes" htmlFor="assistant-notes" error={errors.notes?.message}>
              <Textarea
                id="assistant-notes"
                placeholder="Quick meals, no oven, budget friendly…"
                maxLength={300}
                className="min-h-[80px]"
                {...register('notes')}
              />
              <p className="text-right text-[10px] text-muted-foreground">{notes.length}/300</p>
            </Field>

            <div
              aria-live="polite"
              className={cn(
                'flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs',
                limitReached
                  ? 'border-warning/30 bg-warning/10 text-warning'
                  : 'border-border bg-muted/30 text-muted-foreground'
              )}
            >
              <span>
                {usage
                  ? `${usage.remaining} of ${usage.limit} left today`
                  : usageQuery.isError
                    ? 'Daily quota unavailable'
                    : 'Checking daily quota…'}
              </span>
              {usage ? <span>Resets {formatResetTime(usage.resetsAt)}</span> : null}
            </div>

            <GradientButton
              type="submit"
              className="w-full"
              loading={generate.isPending}
              disabled={limitReached}
            >
              <Sparkles className="h-4 w-4" />
              {limitReached
                ? `Limit reached — resets ${formatResetTime(usage?.resetsAt)}`
                : generate.isPending
                  ? 'Generating…'
                  : 'Generate'}
            </GradientButton>
          </form>
        </Card>

        <div className="space-y-4">
          {generate.isPending ? (
            <Card className="space-y-3 p-5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-32 w-full" />
            </Card>
          ) : error ? (
            <Card className="border-destructive/30 bg-destructive/5 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
                <div>
                  <h2 className="font-semibold">Could not generate a draft</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Adjust the form and try again. The daily allowance resets at midnight
                    {usage ? ` (${formatResetTime(usage.resetsAt)})` : ''}.
                  </p>
                </div>
              </div>
            </Card>
          ) : !result ? (
            <Card className="flex min-h-[280px] flex-col items-center justify-center p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-semibold">A draft will appear here</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Fill in the form and generate. Ingredients, targets, citations and warnings are all
                shown before anything is saved.
              </p>
            </Card>
          ) : result.mode === 'plan' && result.plan ? (
            <>
              <Card className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Badge variant="success">Draft plan</Badge>
                    <h2 className="mt-2 font-semibold">{result.plan.summary}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold">{formatNumber(result.plan.dailyTargets.calories)}</p>
                    <p className="text-xs text-muted-foreground">kcal / day</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {[
                    ['Protein', result.plan.dailyTargets.proteinG],
                    ['Carbs', result.plan.dailyTargets.carbsG],
                    ['Fat', result.plan.dailyTargets.fatG]
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-xl border bg-muted/30 p-2">
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium">{formatNumber(Number(value))} g</p>
                    </div>
                  ))}
                </div>

                {result.plan.warnings.length ? (
                  <div className="mt-3 rounded-xl border border-warning/30 bg-warning/10 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-warning">
                      <AlertTriangle className="h-3.5 w-3.5" /> Warnings
                    </p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                      {result.plan.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {result.plan.assumptions.length ? (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground">Assumptions</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                      {result.plan.assumptions.map((assumption) => (
                        <li key={assumption}>{assumption}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Card>

              <Card className="p-4 sm:p-5">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {DAY_KEYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={previewDay === day}
                      onClick={() => setPreviewDay(day)}
                      className={cn(
                        'min-h-10 shrink-0 rounded-full border px-3 text-xs font-medium',
                        previewDay === day
                          ? 'border-primary/40 bg-primary/12 text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      {DAY_LABELS[day].slice(0, 3)}
                    </button>
                  ))}
                </div>

                <div className="mt-3 space-y-2">
                  {previewMeals.map((meal, index) => (
                    <div key={index} className="rounded-xl border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                          {MEAL_LABELS[meal.type]}
                          {meal.time ? <span className="ml-2 text-xs text-muted-foreground">{meal.time}</span> : null}
                        </p>
                        <span className="text-xs text-muted-foreground">{mealCalories(meal)} kcal</span>
                      </div>
                      <ul className="mt-1 space-y-0.5">
                        {meal.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="text-xs text-muted-foreground">
                            {item.name} · {item.quantity}{item.unit} · {item.calories} kcal
                          </li>
                        ))}
                      </ul>
                      {meal.notes ? <p className="mt-1 text-[11px] text-muted-foreground">{meal.notes}</p> : null}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4 sm:p-5">
                <p className="text-xs font-medium text-muted-foreground">Sources</p>
                <ul className="mt-1 space-y-1 text-xs">
                  {result.plan.citations.map((citation) => (
                    <li key={citation.chunkId} className="text-muted-foreground">
                      {citation.source} <span className="opacity-60">({citation.chunkId.slice(-6)})</span>
                    </li>
                  ))}
                  {result.plan.citations.length === 0 ? (
                    <li className="text-muted-foreground">No retrieved sources for this draft.</li>
                  ) : null}
                </ul>
                <p className="mt-3 rounded-xl bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
                  {result.plan.disclaimer}
                </p>
                <GradientButton className="mt-4 w-full" onClick={() => existingPlan ? setConfirmReplace(true) : adoptPlan()} loading={savePlan.isPending}>
                  Add to my diet plan
                </GradientButton>
                {existingPlan ? (
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    This will replace “{existingPlan.name}”.
                  </p>
                ) : null}
              </Card>
            </>
          ) : result.meal ? (
            <>
              <Card className="p-4 sm:p-5">
                <Badge variant="success">Draft meal</Badge>
                <div className="mt-2 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">
                      {MEAL_LABELS[result.meal.type]} · {DAY_LABELS[mealDay]}
                    </h2>
                    {result.meal.time ? <p className="text-xs text-muted-foreground">{result.meal.time}</p> : null}
                  </div>
                  <p className="text-sm font-medium">{mealCalories(result.meal)} kcal</p>
                </div>

                <ul className="mt-3 space-y-2">
                  {result.meal.items.map((item, index) => (
                    <li key={index} className="rounded-xl border p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{item.name}</p>
                        <span className="text-xs text-muted-foreground">{item.calories} kcal</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {item.quantity}{item.unit} · P {item.proteinG}g · C {item.carbsG}g · F {item.fatG}g
                      </p>
                    </li>
                  ))}
                </ul>

                {result.meal.notes ? (
                  <p className="mt-2 text-xs text-muted-foreground">{result.meal.notes}</p>
                ) : null}

                {result.warnings?.length ? (
                  <div className="mt-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-muted-foreground">
                    {result.warnings.join(' · ')}
                  </div>
                ) : null}

                <div className="mt-3 text-xs text-muted-foreground">
                  <p className="font-medium">Sources</p>
                  <p className="mt-1">
                    {result.citations?.length
                      ? result.citations.map((citation) => citation.source).join(' · ')
                      : 'No retrieved sources for this draft.'}
                  </p>
                </div>

                <p className="mt-3 rounded-xl bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
                  {result.disclaimer}
                </p>

                <GradientButton
                  className="mt-4 w-full"
                  onClick={adoptMeal}
                  loading={savePlan.isPending}
                  disabled={!existingPlan}
                >
                  Add meal to {DAY_LABELS[mealDay]}
                </GradientButton>
                {!existingPlan ? (
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    Create a diet plan first to add a single meal.{' '}
                    <Link to="/diet/plan" className="text-primary hover:underline">
                      Create plan
                    </Link>
                  </p>
                ) : null}
              </Card>
            </>
          ) : null}

          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            Informational only, not medical advice. The assistant uses retrieved general guidance
            and can be wrong. Adjust portions to your own needs.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReplace}
        onOpenChange={setConfirmReplace}
        title="Replace your diet plan?"
        description={`“${existingPlan?.name ?? 'Your plan'}” will be replaced by the generated plan. Meal logs are not deleted.`}
        confirmLabel="Replace plan"
        destructive
        pending={savePlan.isPending}
        onConfirm={adoptPlan}
      />
    </div>
  );
}
