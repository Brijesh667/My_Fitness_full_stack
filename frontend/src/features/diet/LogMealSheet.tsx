import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { ResponsiveSheet } from '@/components/ui/responsive-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MEAL_LABELS, MEAL_TYPES, UNITS, type MealType } from '@/lib/dates';
import { dietItemSchema } from '@/lib/schemas/diet';
import type { DietItem } from '@/lib/types';

const blankItem = (): DietItem => ({
  name: '',
  quantity: 100,
  unit: 'g',
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0
});

export function LogMealSheet({
  open,
  onOpenChange,
  title,
  type,
  items,
  allowTypeChange = false,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  type: MealType;
  items: DietItem[];
  allowTypeChange?: boolean;
  onSave: (mealType: MealType, items: DietItem[]) => void;
}) {
  const [mealType, setMealType] = useState<MealType>(type);
  const [draft, setDraft] = useState<DietItem[]>(items);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setMealType(type);
    setDraft(items.length ? items.map((item) => ({ ...item })) : [blankItem()]);
    setErrors({});
    // Intentionally initialise only when the sheet opens.
  }, [open]);

  const update = (index: number, patch: Partial<DietItem>) => {
    setDraft((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  const submit = () => {
    const nextErrors: Record<string, string> = {};
    draft.forEach((item, index) => {
      const result = dietItemSchema.safeParse(item);
      if (!result.success) {
        const issue = result.error.issues[0];
        nextErrors[`${index}.${issue.path.join('.')}`] = issue.message;
      }
    });

    if (draft.length === 0) nextErrors.empty = 'Add at least one item.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error('Some food details need fixing.');
      return;
    }

    onSave(mealType, draft);
  };

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Totals are rounded by the server after saving."
      footer={
        <Button className="w-full" onClick={submit}>
          Save meal
        </Button>
      }
    >
      <div className="space-y-4">
        {allowTypeChange ? (
          <div>
            <Label htmlFor="log-meal-type">Meal</Label>
            <Select
              id="log-meal-type"
              className="mt-1.5"
              value={mealType}
              onChange={(event) => setMealType(event.target.value as MealType)}
            >
              {MEAL_TYPES.map((value) => (
                <option key={value} value={value}>
                  {MEAL_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <div className="space-y-3">
          {draft.map((item, index) => (
            <div key={index} className="rounded-xl border bg-background p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Food {index + 1}</p>
                {draft.length > 1 ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove food ${index + 1}`}
                    onClick={() => setDraft((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    aria-label="Food name"
                    placeholder="Food name"
                    value={item.name}
                    maxLength={50}
                    onChange={(event) => update(index, { name: event.target.value })}
                  />
                  {errors[`${index}.name`] ? <p className="mt-1 text-xs text-destructive">{errors[`${index}.name`]}</p> : null}
                </div>
                <div className="grid grid-cols-[1fr_96px] gap-2">
                  <Input
                    aria-label="Quantity"
                    type="number"
                    inputMode="decimal"
                    min={0.1}
                    max={10000}
                    step="0.1"
                    value={item.quantity}
                    onChange={(event) => update(index, { quantity: Number(event.target.value) })}
                  />
                  <Select
                    aria-label="Unit"
                    value={item.unit}
                    onChange={(event) => update(index, { unit: event.target.value as DietItem['unit'] })}
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Input
                    aria-label="Calories"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={5000}
                    value={item.calories}
                    onChange={(event) => update(index, { calories: Number(event.target.value) })}
                  />
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Calories</p>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                  {(
                    [
                      ['proteinG', 'Protein'],
                      ['carbsG', 'Carbs'],
                      ['fatG', 'Fat']
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <Input
                        aria-label={label}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={1000}
                        value={item[key]}
                        onChange={(event) => update(index, { [key]: Number(event.target.value) })}
                      />
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{label} (g)</p>
                    </div>
                  ))}
                </div>
              </div>
              {errors[`${index}.quantity`] ? (
                <p className="mt-1 text-xs text-destructive">{errors[`${index}.quantity`]}</p>
              ) : null}
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setDraft((current) => [...current, blankItem()])}
          disabled={draft.length >= 15}
        >
          <Plus className="h-4 w-4" /> Add food
        </Button>
        {draft.length >= 15 ? <p className="text-center text-xs text-muted-foreground">Max 15 items</p> : null}
        {errors.empty ? <p className="text-xs text-destructive">{errors.empty}</p> : null}
      </div>
    </ResponsiveSheet>
  );
}
