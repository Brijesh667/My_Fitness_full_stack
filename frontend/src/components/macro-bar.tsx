import { Progress } from '@/components/ui/progress';
import { formatNumber } from '@/lib/utils';

export function MacroBar({
  label,
  value,
  target,
  unit = 'g'
}: {
  label: string;
  value: number;
  target: number;
  unit?: string;
}) {
  const pct = target > 0 ? (value / target) * 100 : 0;
  const over = pct > 105;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium">{label}</span>
        <span className={over ? 'text-warning' : 'text-muted-foreground'}>
          {formatNumber(value, 1)}
          {unit} / {formatNumber(target, 0)}
          {unit}
        </span>
      </div>
      <Progress
        value={Math.min(100, pct)}
        className="mt-1.5 h-2"
        label={`${label} progress`}
        barClassName={over ? 'bg-warning' : undefined}
      />
    </div>
  );
}
