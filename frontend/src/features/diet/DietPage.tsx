import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Apple, Check, Pencil, Plus, SkipForward, Sparkles, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MacroBar } from '@/components/macro-bar';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LogMealSheet } from './LogMealSheet';
import { useDietLog, useDietPlan, useSaveDietLog } from './api';
import {
  MEAL_LABELS,
  formatDateLong,
  dayKeyFromDateKey,
  todayKey,
  type MealType
} from '@/lib/dates';
import { getApiError } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import type { DietItem, DietLogMeal } from '@/lib/types';

type LogStatus = DietLogMeal['status'];

interface Row {
  key: string;
  planMealId?: string | null;
  logIndex?: number;
  type: MealType;
  status?: LogStatus;
  items: DietItem[];
  time?: string;
  notes?: string;
  extra: boolean;
}

function cleanItems(items: DietItem[]): DietItem[] {
  return items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG
  }));
}

function payload(meals: DietLogMeal[]) {
  return meals.map((meal) => ({
    ...(meal._id ? { _id: meal._id } : {}),
    planMealId: meal.planMealId ?? null,
    type: meal.type,
    status: meal.status,
    items: cleanItems(meal.items)
  }));
}

export default function DietPage() {
  const date = todayKey();
  const planQuery = useDietPlan();
  const logQuery = useDietLog(date);
  const saveLog = useSaveDietLog(date);
  const [editing, setEditing] = useState<Row | null>(null);
  const [addingExtra, setAddingExtra] = useState(false);

  const plan = planQuery.data ?? null;
  const log = logQuery.data?.log;
  const planDay = plan?.days.find((day) => day.day === dayKeyFromDateKey(date));

  const rows: Row[] = [];
  for (const meal of planDay?.meals ?? []) {
    const logged = log?.meals.find((entry) => entry.planMealId && entry.planMealId === meal._id);
    rows.push({
      key: meal._id ?? `${meal.type}-${rows.length}`,
      planMealId: meal._id ?? null,
      type: meal.type,
      status: logged?.status,
      items: logged?.items ?? meal.items,
      time: meal.time,
      notes: meal.notes,
      extra: false
    });
  }

  (log?.meals ?? []).forEach((meal, index) => {
    const isPlanned = meal.planMealId && planDay?.meals.some((entry) => entry._id === meal.planMealId);
    if (isPlanned) return;
    rows.push({
      key: `extra-${index}`,
      planMealId: null,
      logIndex: index,
      type: meal.type,
      status: meal.status,
      items: meal.items,
      extra: true
    });
  });

  const saveStatus = (row: Row, status: LogStatus) => {
    const next = payload(log?.meals ?? []);
    const index = row.planMealId
      ? next.findIndex((meal) => meal.planMealId === row.planMealId)
      : row.logIndex !== undefined
        ? row.logIndex
        : -1;

    if (index >= 0) {
      next[index] = { ...next[index], status, items: cleanItems(row.items) };
    } else {
      next.push({
        planMealId: row.planMealId ?? null,
        type: row.type,
        status,
        items: cleanItems(row.items)
      });
    }

    saveLog.mutate(next, {
      onSuccess: () => toast.success(`Marked ${MEAL_LABELS[row.type].toLowerCase()} ${status}.`),
      onError: (error) => toast.error(getApiError(error).message)
    });
  };

  const saveEditedItems = (row: Row, items: DietItem[]) => {
    const next = payload(log?.meals ?? []);
    const status: LogStatus = row.status === 'skipped' ? 'modified' : 'modified';
    const index = row.planMealId
      ? next.findIndex((meal) => meal.planMealId === row.planMealId)
      : row.logIndex !== undefined
        ? row.logIndex
        : -1;

    if (index >= 0) {
      next[index] = { ...next[index], status: row.extra ? next[index].status : status, items: cleanItems(items) };
    } else {
      next.push({
        planMealId: row.planMealId ?? null,
        type: row.type,
        status,
        items: cleanItems(items)
      });
    }

    saveLog.mutate(next, {
      onSuccess: () => {
        toast.success('Meal updated.');
        setEditing(null);
      },
      onError: (error) => toast.error(getApiError(error).message)
    });
  };

  const addExtra = (type: MealType, items: DietItem[]) => {
    const next = payload(log?.meals ?? []);
    next.push({ planMealId: null, type, status: 'eaten', items: cleanItems(items) });
    saveLog.mutate(next, {
      onSuccess: () => {
        toast.success('Extra food added.');
        setAddingExtra(false);
      },
      onError: (error) => toast.error(getApiError(error).message)
    });
  };

  const removeExtra = (row: Row) => {
    if (row.logIndex === undefined) return;
    const next = payload(log?.meals ?? []).filter((_, index) => index !== row.logIndex);
    saveLog.mutate(next, {
      onSuccess: () => toast.success('Extra food removed.'),
      onError: (error) => toast.error(getApiError(error).message)
    });
  };

  if (planQuery.isLoading || logQuery.isLoading) {
    return (
      <div className="container-page space-y-4 py-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  if (planQuery.isError || logQuery.isError) {
    return (
      <div className="container-page py-6">
        <ErrorState
          error={planQuery.error ?? logQuery.error}
          onRetry={() => {
            planQuery.refetch();
            logQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-6 sm:py-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {formatDateLong(date)}
          </p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Today’s diet</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/diet/plan">
            <Button variant="outline" size="sm">
              Edit plan
            </Button>
          </Link>
          <Link to="/diet/assistant">
            <Button variant="secondary" size="sm">
              <Sparkles className="h-4 w-4" /> Assistant
            </Button>
          </Link>
        </div>
      </header>

      {!plan ? (
        <EmptyState
          icon={Apple}
          title="No diet plan yet"
          description="Create a plan manually, or generate a structured starting point with the assistant."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to="/diet/plan">
                <Button>Create diet plan</Button>
              </Link>
              <Link to="/diet/assistant">
                <Button variant="outline">
                  <Sparkles className="h-4 w-4" /> Open assistant
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">Macros vs targets</h2>
                <p className="text-xs text-muted-foreground">
                  {logQuery.data?.exists === false ? 'Nothing logged yet today.' : 'Totals update as you tick meals.'}
                </p>
              </div>
              <Badge variant={(log?.adherencePct ?? 0) >= 70 ? 'success' : 'muted'}>
                {log?.adherencePct ?? 0}% adherence
              </Badge>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MacroBar
                label="Calories"
                value={log?.totals.calories ?? 0}
                target={plan.dailyTargets.calories}
                unit=" kcal"
              />
              <MacroBar
                label="Protein"
                value={log?.totals.proteinG ?? 0}
                target={plan.dailyTargets.proteinG}
              />
              <MacroBar label="Carbs" value={log?.totals.carbsG ?? 0} target={plan.dailyTargets.carbsG} />
              <MacroBar label="Fat" value={log?.totals.fatG ?? 0} target={plan.dailyTargets.fatG} />
            </div>
          </Card>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Meals</h2>
              <Button variant="outline" size="sm" onClick={() => setAddingExtra(true)}>
                <Plus className="h-4 w-4" /> Add extra food
              </Button>
            </div>

            {rows.length === 0 ? (
              <EmptyState
                icon={Apple}
                title="No meals planned for today"
                description="This day in your diet plan is empty."
                action={
                  <Link to="/diet/plan">
                    <Button variant="outline">Edit today in the plan</Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-2.5">
                {rows.map((row) => {
                  const total = row.items.reduce((sum, item) => sum + item.calories, 0);
                  return (
                    <Card key={row.key} className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium">{MEAL_LABELS[row.type]}</h3>
                            {row.extra ? <Badge variant="outline">Extra</Badge> : null}
                            {row.time ? <span className="text-xs text-muted-foreground">{row.time}</span> : null}
                            {row.status ? (
                              <Badge
                                variant={
                                  row.status === 'eaten'
                                    ? 'success'
                                    : row.status === 'skipped'
                                      ? 'muted'
                                      : 'warning'
                                }
                              >
                                {row.status}
                              </Badge>
                            ) : (
                              <Badge variant="muted">Not logged</Badge>
                            )}
                          </div>
                          {row.notes ? (
                            <p className="mt-1 text-xs text-muted-foreground">{row.notes}</p>
                          ) : null}
                        </div>
                        <p className="text-sm font-medium">{formatNumber(total)} kcal</p>
                      </div>

                      <ul className="mt-2 space-y-1">
                        {row.items.map((item, index) => (
                          <li key={index} className="flex items-baseline justify-between gap-2 text-sm">
                            <span className="text-muted-foreground">
                              {item.name} <span className="text-xs">· {item.quantity}{item.unit}</span>
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">{item.calories} kcal</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={row.status === 'eaten' ? 'default' : 'outline'}
                          onClick={() => saveStatus(row, 'eaten')}
                          disabled={saveLog.isPending}
                        >
                          <Check className="h-3.5 w-3.5" /> Eaten
                        </Button>
                        <Button
                          size="sm"
                          variant={row.status === 'skipped' ? 'secondary' : 'outline'}
                          onClick={() => saveStatus(row, 'skipped')}
                          disabled={saveLog.isPending}
                        >
                          <SkipForward className="h-3.5 w-3.5" /> Skipped
                        </Button>
                        <Button
                          size="sm"
                          variant={row.status === 'modified' ? 'default' : 'outline'}
                          onClick={() => setEditing(row)}
                          disabled={saveLog.isPending}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Modified
                        </Button>
                        {row.extra ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removeExtra(row)}
                            disabled={saveLog.isPending}
                          >
                            <X className="h-3.5 w-3.5" /> Remove
                          </Button>
                        ) : null}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Log totals are calculated by the server from the items you keep.
          </p>
        </div>
      )}

      <LogMealSheet
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={editing ? `Edit ${MEAL_LABELS[editing.type].toLowerCase()}` : 'Edit meal'}
        type={editing?.type ?? 'lunch'}
        items={editing?.items ?? []}
        onSave={(_, items) => {
          if (editing) saveEditedItems(editing, items);
        }}
      />

      <LogMealSheet
        open={addingExtra}
        onOpenChange={setAddingExtra}
        title="Add extra food"
        type="snack"
        items={[]}
        allowTypeChange
        onSave={addExtra}
      />
    </div>
  );
}
