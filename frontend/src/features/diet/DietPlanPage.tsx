import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/error-state';
import { useDietPlan, useUpsertDietPlan } from './api';
import {
  DAY_KEYS,
  DAY_LABELS,
  GOAL_LABELS,
  MEAL_LABELS,
  MEAL_TYPES,
  UNITS,
  type DayKey,
  type MealType
} from '@/lib/dates';
import { dietPlanFormSchema } from '@/lib/schemas/diet';
import { getApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { DietItem, DietPlan } from '@/lib/types';

interface DraftMeal {
  _id?: string;
  type: MealType;
  time: string;
  notes: string;
  items: DietItem[];
}

interface Draft {
  name: string;
  goal: DietPlan['goal'];
  dailyTargets: DietPlan['dailyTargets'];
  days: { day: DayKey; meals: DraftMeal[] }[];
}

const blankItem = (): DietItem => ({
  name: '',
  quantity: 100,
  unit: 'g',
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0
});

const blankMeal = (type: MealType): DraftMeal => ({
  type,
  time: '',
  notes: '',
  items: [blankItem()]
});

function defaultDraft(): Draft {
  return {
    name: 'My diet plan',
    goal: 'maintain',
    dailyTargets: { calories: 2000, proteinG: 120, carbsG: 220, fatG: 60 },
    days: DAY_KEYS.map((day) => ({ day, meals: [] }))
  };
}

function toDraft(plan: DietPlan): Draft {
  return {
    name: plan.name,
    goal: plan.goal,
    dailyTargets: { ...plan.dailyTargets },
    days: DAY_KEYS.map((day) => {
      const source = plan.days.find((entry) => entry.day === day);
      return {
        day,
        meals: (source?.meals ?? []).map((meal) => ({
          ...(meal._id ? { _id: meal._id } : {}),
          type: meal.type,
          time: meal.time ?? '',
          notes: meal.notes ?? '',
          items: meal.items.map((item) => ({ ...item }))
        }))
      };
    })
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[11px] text-destructive">{message}</p>;
}

export default function DietPlanPage() {
  const planQuery = useDietPlan();
  const savePlan = useUpsertDietPlan();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [activeDay, setActiveDay] = useState<DayKey>('mon');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const initialised = useRef(false);

  useEffect(() => {
    if (initialised.current || !planQuery.isSuccess) return;
    const plan = planQuery.data ?? null;
    setDraft(plan ? toDraft(plan) : defaultDraft());
    initialised.current = true;
  }, [planQuery.isSuccess, planQuery.data]);

  if (planQuery.isLoading) {
    return (
      <div className="container-page space-y-4 py-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
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

  if (!draft) return null;

  const dayIndex = draft.days.findIndex((day) => day.day === activeDay);
  const day = draft.days[dayIndex];

  const update = (updater: (current: Draft) => Draft) => {
    setDraft((current) => (current ? updater(current) : current));
  };

  const updateDayMeals = (updater: (meals: DraftMeal[]) => DraftMeal[]) => {
    update((current) => ({
      ...current,
      days: current.days.map((entry) =>
        entry.day === activeDay ? { ...entry, meals: updater(entry.meals) } : entry
      )
    }));
  };

  const updateMeal = (mealIndex: number, updater: (meal: DraftMeal) => DraftMeal) => {
    updateDayMeals((meals) => meals.map((meal, index) => (index === mealIndex ? updater(meal) : meal)));
  };

  const updateItem = (mealIndex: number, itemIndex: number, patch: Partial<DietItem>) => {
    updateMeal(mealIndex, (meal) => ({
      ...meal,
      items: meal.items.map((item, index) => (index === itemIndex ? { ...item, ...patch } : item))
    }));
  };

  const onSave = () => {
    setFormError(null);
    setFieldErrors({});

    const candidate = {
      name: draft.name,
      goal: draft.goal,
      dailyTargets: draft.dailyTargets,
      days: draft.days.map((entry) => ({
        day: entry.day,
        meals: entry.meals.map((meal) => ({
          ...(meal._id ? { _id: meal._id } : {}),
          type: meal.type,
          ...(meal.time ? { time: meal.time } : {}),
          ...(meal.notes ? { notes: meal.notes } : {}),
          items: meal.items
        }))
      }))
    };

    const result = dietPlanFormSchema.safeParse(candidate);
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      setFormError(
        result.error.issues
          .slice(0, 3)
          .map((issue) => `${issue.path.join('.') || 'plan'}: ${issue.message}`)
          .join(' · ')
      );
      toast.error('Fix the highlighted fields before saving.');
      return;
    }

    savePlan.mutate(
      {
        ...result.data,
        source: 'manual' as const
      },
      {
        onSuccess: (plan) => {
          toast.success('Diet plan saved.');
          setDraft(toDraft(plan));
        },
        onError: (error) => setFormError(getApiError(error).message)
      }
    );
  };

  const path = (suffix: string) => `${suffix}`;

  return (
    <div className="container-page py-5 sm:py-8">
      <Link to="/diet" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Today’s diet
      </Link>

      <header className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            {planQuery.data ? 'Edit diet plan' : 'Create diet plan'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One plan, seven days. You can log what you actually eat from the diet page.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/diet/assistant">
            <Button variant="outline" size="sm">
              <Sparkles className="h-4 w-4" /> Assistant
            </Button>
          </Link>
          <Button size="sm" onClick={onSave} disabled={savePlan.isPending}>
            {savePlan.isPending ? 'Saving…' : 'Save plan'}
          </Button>
        </div>
      </header>

      {formError ? (
        <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <Card className="mt-5 p-4 sm:p-5">
        <h2 className="font-semibold">Plan details</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="diet-plan-name" className="mb-1 block text-xs font-medium text-muted-foreground">
              Plan name
            </label>
            <Input
              id="diet-plan-name"
              value={draft.name}
              maxLength={40}
              onChange={(event) => update((current) => ({ ...current, name: event.target.value }))}
            />
            <FieldError message={fieldErrors[path('name')]} />
          </div>
          <div>
            <label htmlFor="diet-plan-goal" className="mb-1 block text-xs font-medium text-muted-foreground">
              Goal
            </label>
            <Select
              id="diet-plan-goal"
              value={draft.goal}
              onChange={(event) =>
                update((current) => ({ ...current, goal: event.target.value as DietPlan['goal'] }))
              }
            >
              {Object.entries(GOAL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <h3 className="mt-4 text-sm font-medium">Daily targets</h3>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ['calories', 'Calories'],
              ['proteinG', 'Protein (g)'],
              ['carbsG', 'Carbs (g)'],
              ['fatG', 'Fat (g)']
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`target-${key}`} className="mb-1 block text-[11px] text-muted-foreground">
                {label}
              </label>
              <Input
                id={`target-${key}`}
                type="number"
                inputMode="numeric"
                min={0}
                value={draft.dailyTargets[key]}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    dailyTargets: { ...current.dailyTargets, [key]: Number(event.target.value) }
                  }))
                }
              />
              <FieldError message={fieldErrors[path(`dailyTargets.${key}`)]} />
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-5 overflow-x-auto pb-1">
        <div className="flex gap-2" role="tablist" aria-label="Diet plan days">
          {draft.days.map((entry) => {
            const selected = entry.day === activeDay;
            return (
              <button
                key={entry.day}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveDay(entry.day)}
                className={cn(
                  'flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors',
                  selected ? 'border-primary/40 bg-primary/12 text-primary' : 'bg-background text-muted-foreground'
                )}
              >
                {DAY_LABELS[entry.day].slice(0, 3)}
                {entry.meals.length ? <Badge variant="muted">{entry.meals.length}</Badge> : null}
              </button>
            );
          })}
        </div>
      </div>

      <Card className="mt-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">{DAY_LABELS[activeDay]}</h2>
            <p className="text-xs text-muted-foreground">Up to 8 meals, 15 items per meal.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              updateDayMeals((meals) => [
                ...meals,
                blankMeal(MEAL_TYPES[Math.min(meals.length, MEAL_TYPES.length - 1)])
              ])
            }
            disabled={day.meals.length >= 8}
          >
            <Plus className="h-4 w-4" /> Add meal
          </Button>
        </div>
        {day.meals.length >= 8 ? (
          <p className="mt-2 text-xs text-muted-foreground">Max 8 meals for this day.</p>
        ) : null}

        {day.meals.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm font-medium">No meals yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Add a meal to build this day.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => updateDayMeals(() => [blankMeal('breakfast')])}
            >
              <Plus className="h-4 w-4" /> Add breakfast
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {day.meals.map((meal, mealIndex) => (
              <div key={meal._id ?? mealIndex} className="rounded-2xl border bg-background/40 p-3">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[130px] flex-1">
                    <label
                      htmlFor={`meal-type-${mealIndex}`}
                      className="mb-1 block text-[11px] text-muted-foreground"
                    >
                      Meal
                    </label>
                    <Select
                      id={`meal-type-${mealIndex}`}
                      value={meal.type}
                      onChange={(event) =>
                        updateMeal(mealIndex, (current) => ({
                          ...current,
                          type: event.target.value as MealType
                        }))
                      }
                      className="h-10"
                    >
                      {MEAL_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {MEAL_LABELS[type]}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="w-28">
                    <label
                      htmlFor={`meal-time-${mealIndex}`}
                      className="mb-1 block text-[11px] text-muted-foreground"
                    >
                      Time
                    </label>
                    <Input
                      id={`meal-time-${mealIndex}`}
                      type="time"
                      value={meal.time}
                      onChange={(event) =>
                        updateMeal(mealIndex, (current) => ({ ...current, time: event.target.value }))
                      }
                      className="h-10"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove meal ${mealIndex + 1}`}
                    onClick={() => updateDayMeals((meals) => meals.filter((_, index) => index !== mealIndex))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <FieldError
                  message={fieldErrors[path(`days.${dayIndex}.meals.${mealIndex}.time`)]}
                />

                <div className="mt-2">
                  <Input
                    aria-label={`Notes for meal ${mealIndex + 1}`}
                    placeholder="Notes (optional, up to 200 characters)"
                    maxLength={200}
                    value={meal.notes}
                    onChange={(event) =>
                      updateMeal(mealIndex, (current) => ({ ...current, notes: event.target.value }))
                    }
                    className="h-10"
                  />
                  <p className="mt-0.5 text-right text-[10px] text-muted-foreground">
                    {meal.notes.length}/200
                  </p>
                </div>

                <div className="mt-2 space-y-2">
                  {meal.items.map((item, itemIndex) => {
                    const prefix = `days.${dayIndex}.meals.${mealIndex}.items.${itemIndex}`;
                    return (
                      <div key={itemIndex} className="rounded-xl border bg-card p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium">Food {itemIndex + 1}</p>
                          {meal.items.length > 1 ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Remove food ${itemIndex + 1}`}
                              onClick={() =>
                                updateMeal(mealIndex, (current) => ({
                                  ...current,
                                  items: current.items.filter((_, index) => index !== itemIndex)
                                }))
                              }
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          ) : null}
                        </div>

                        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-[2fr_1fr_80px]">
                          <div>
                            <Input
                              aria-label={`Food ${itemIndex + 1} name`}
                              placeholder="Food name"
                              maxLength={50}
                              value={item.name}
                              onChange={(event) => updateItem(mealIndex, itemIndex, { name: event.target.value })}
                              className="h-10"
                            />
                            <FieldError message={fieldErrors[path(`${prefix}.name`)]} />
                          </div>
                          <div>
                            <Input
                              aria-label={`Food ${itemIndex + 1} quantity`}
                              type="number"
                              inputMode="decimal"
                              min={0.1}
                              max={10000}
                              step="0.1"
                              value={item.quantity}
                              onChange={(event) =>
                                updateItem(mealIndex, itemIndex, { quantity: Number(event.target.value) })
                              }
                              className="h-10"
                            />
                            <FieldError message={fieldErrors[path(`${prefix}.quantity`)]} />
                          </div>
                          <Select
                            aria-label={`Food ${itemIndex + 1} unit`}
                            value={item.unit}
                            onChange={(event) =>
                              updateItem(mealIndex, itemIndex, {
                                unit: event.target.value as DietItem['unit']
                              })
                            }
                            className="h-10"
                          >
                            {UNITS.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </Select>
                        </div>

                        <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                          {(
                            [
                              ['calories', 'Calories'],
                              ['proteinG', 'Protein'],
                              ['carbsG', 'Carbs'],
                              ['fatG', 'Fat']
                            ] as const
                          ).map(([key, label]) => (
                            <div key={key}>
                              <Input
                                aria-label={`Food ${itemIndex + 1} ${label}`}
                                type="number"
                                inputMode="numeric"
                                min={0}
                                value={item[key]}
                                onChange={(event) =>
                                  updateItem(mealIndex, itemIndex, { [key]: Number(event.target.value) })
                                }
                                className="h-9"
                              />
                              <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
                              <FieldError message={fieldErrors[path(`${prefix}.${key}`)]} />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    updateMeal(mealIndex, (current) => ({
                      ...current,
                      items: [...current.items, blankItem()]
                    }))
                  }
                  disabled={meal.items.length >= 15}
                >
                  <Plus className="h-3.5 w-3.5" /> Add food
                </Button>
                {meal.items.length >= 15 ? (
                  <span className="ml-2 text-[11px] text-muted-foreground">Max 15 items</span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 mt-5 lg:bottom-4">
        <Card className="flex items-center justify-between gap-3 border bg-background/95 p-3 shadow-lg backdrop-blur">
          <p className="hidden text-xs text-muted-foreground sm:block">
            Changes apply to future diet logs.
          </p>
          <Button className="w-full sm:w-auto" onClick={onSave} disabled={savePlan.isPending}>
            {savePlan.isPending ? 'Saving…' : 'Save plan'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
