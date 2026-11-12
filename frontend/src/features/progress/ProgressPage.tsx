import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  Activity,
  BarChart3,
  CalendarCheck,
  Flame,
  Sparkles,
  Timer,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { DAY_KEYS, DAY_LABELS, MUSCLE_LABELS, dayKeyFromDateKey, formatDateShort } from '@/lib/dates';
import { cn, formatDurationMin, formatNumber } from '@/lib/utils';
import type { HeatmapResponse } from '@/lib/types';
import { useAnalytics, useHeatmap } from './api';

const LIME = '#bef264';
const EMERALD = '#34d399';
const GRID = 'hsl(var(--border))';
const MUTED = 'hsl(var(--muted-foreground))';

function StatCard({
  icon: Icon,
  label,
  value,
  hint
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" aria-hidden />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

function ChartCard({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3">
        <h2 className="font-semibold">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {children}
    </Card>
  );
}

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  fontSize: '12px',
  color: 'hsl(var(--foreground))'
};

function MuscleChart({ summary }: { summary: ReturnType<typeof useAnalytics>['data'] }) {
  const data = (summary?.muscles ?? []).map((muscle) => ({
    name: MUSCLE_LABELS[muscle.muscle],
    pct: muscle.pct
  }));

  if (!data.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No muscle data in this range.</p>;
  }

  return (
    <div style={{ height: Math.max(180, data.length * 34) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} unit="%" />
          <YAxis type="category" dataKey="name" width={82} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} formatter={(value) => [`${value}%`, 'Completed']} />
          <Bar dataKey="pct" fill={EMERALD} radius={[0, 6, 6, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function WeekdayChart({ summary }: { summary: ReturnType<typeof useAnalytics>['data'] }) {
  const data = (summary?.weekdays ?? []).map((day) => ({
    name: DAY_LABELS[day.day].slice(0, 3),
    pct: day.pct,
    plannedDays: day.plannedDays
  }));

  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -22, right: 4, top: 4, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} unit="%" />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} formatter={(value) => [`${value}%`, 'Consistency']} />
          <Bar dataKey="pct" fill={LIME} radius={[6, 6, 0, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrendChart({ summary }: { summary: ReturnType<typeof useAnalytics>['data'] }) {
  const data = (summary?.trend ?? []).map((point) => ({
    name: formatDateShort(point.weekStart),
    pct: point.pct
  }));

  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -22, right: 8, top: 4, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: MUTED }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} unit="%" />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, 'Consistency']} />
          <Line type="monotone" dataKey="pct" stroke={EMERALD} strokeWidth={2.5} dot={{ r: 3, fill: EMERALD }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function intensityClass(pct: number | null) {
  if (pct === null) return 'border border-border/60 bg-muted/30';
  if (pct <= 0) return 'bg-muted';
  if (pct < 25) return 'bg-emerald-900/60';
  if (pct < 50) return 'bg-emerald-700/70';
  if (pct < 75) return 'bg-emerald-500/80';
  return 'bg-[linear-gradient(135deg,#bef264,#34d399)]';
}

function Heatmap({ data }: { data: HeatmapResponse | undefined }) {
  const weeks = useMemo(() => {
    if (!data?.heatmap.length) return [];
    const firstIndex = DAY_KEYS.indexOf(dayKeyFromDateKey(data.heatmap[0].date));
    const padded: (HeatmapResponse['heatmap'][number] | null)[] = [
      ...Array.from({ length: firstIndex }, () => null),
      ...data.heatmap
    ];
    const result = [];
    for (let index = 0; index < padded.length; index += 7) {
      result.push(padded.slice(index, index + 7));
    }
    return result;
  }, [data]);

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="flex w-max gap-1">
          <div className="mr-1 flex flex-col justify-between py-0.5 text-[9px] text-muted-foreground">
            {['M', 'W', 'F'].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) =>
                day ? (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.pct === null ? 'rest day' : `${day.pct}%`}`}
                    aria-label={`${day.date}: ${day.pct === null ? 'rest day' : `${day.pct}% complete`}`}
                    className={cn('h-3.5 w-3.5 rounded-[3px]', intensityClass(day.pct))}
                  />
                ) : (
                  <div key={`empty-${dayIndex}`} className="h-3.5 w-3.5" />
                )
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        <span className="h-3 w-3 rounded-[2px] bg-muted" />
        <span className="h-3 w-3 rounded-[2px] bg-emerald-900/60" />
        <span className="h-3 w-3 rounded-[2px] bg-emerald-700/70" />
        <span className="h-3 w-3 rounded-[2px] bg-emerald-500/80" />
        <span className="h-3 w-3 rounded-[2px] bg-[linear-gradient(135deg,#bef264,#34d399)]" />
        <span>More</span>
        <span className="ml-2 h-3 w-3 rounded-[2px] border border-border bg-muted/30" />
        <span>Rest</span>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const [range, setRange] = useState<'week' | 'month'>('week');
  const summaryQuery = useAnalytics(range);
  const heatmapQuery = useHeatmap(120);

  const summary = summaryQuery.data;
  const isLoading = summaryQuery.isLoading || heatmapQuery.isLoading;
  const isError = summaryQuery.isError || heatmapQuery.isError;

  return (
    <div className="container-page py-6 sm:py-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Progress</h1>
          <p className="mt-1 text-sm text-muted-foreground">Consistency over perfection.</p>
        </div>
        <div className="inline-flex rounded-xl border bg-muted/30 p-1" role="group" aria-label="Date range">
          {(['week', 'month'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={range === value}
              onClick={() => setRange(value)}
              className={cn(
                'h-9 rounded-lg px-4 text-sm font-medium transition-colors',
                range === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              {value === 'week' ? 'This week' : '30 days'}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <ErrorState
          error={summaryQuery.error ?? heatmapQuery.error}
          onRetry={() => {
            summaryQuery.refetch();
            heatmapQuery.refetch();
          }}
        />
      ) : !summary || summary.setsCompleted === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Not enough data yet"
          description="Complete a workout and your consistency, streaks and muscle breakdown will appear here."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to="/workout">
                <Button>Open today’s workout</Button>
              </Link>
              <Link to="/plan">
                <Button variant="outline">Review the plan</Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={Activity}
              label="Consistency"
              value={`${summary.consistencyPct}%`}
              hint={`${summary.setsCompleted}/${summary.setsPlanned} sets logged`}
            />
            <StatCard
              icon={Flame}
              label="Streak"
              value={`${summary.streak.current} day${summary.streak.current === 1 ? '' : 's'}`}
              hint={`Best ${summary.streak.best}`}
            />
            <StatCard
              icon={Timer}
              label="Gym time"
              value={formatDurationMin(summary.gymTimeMin)}
              hint={summary.avgSessionMin ? `~${summary.avgSessionMin} min/session` : undefined}
            />
            <StatCard
              icon={CalendarCheck}
              label="Sets completed"
              value={formatNumber(summary.setsCompleted)}
              hint={`${summary.failureSets} failure set${summary.failureSets === 1 ? '' : 's'}`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Muscle completion" subtitle="Completed sets as a share of planned sets">
              <MuscleChart summary={summary} />
            </ChartCard>
            <ChartCard title="Weekday consistency" subtitle="Planned days only; rest days excluded">
              <WeekdayChart summary={summary} />
            </ChartCard>
            <ChartCard title="8-week trend" subtitle="Consistency per week">
              <TrendChart summary={summary} />
            </ChartCard>
            <ChartCard title="Last 120 days" subtitle="Darker means more completed sets">
              <Heatmap data={heatmapQuery.data} />
            </ChartCard>
          </div>

          {summary.insights.length ? (
            <Card className="p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Insights</h2>
              </div>
              <ul className="mt-3 space-y-2">
                {summary.insights.map((insight) => (
                  <li key={insight.key} className="flex gap-2 rounded-xl bg-muted/40 px-3 py-2.5 text-sm">
                    <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>{insight.text}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {summary.volume.length ? (
            <ChartCard title="Volume by exercise" subtitle="Only sets with logged weight">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary.volume.map((item) => ({ name: item.exercise, volume: item.volume }))}
                    layout="vertical"
                    margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid horizontal={false} stroke={GRID} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="volume" fill={LIME} radius={[0, 6, 6, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          ) : null}
        </div>
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Range: {summary ? `${formatDateShort(summary.range.from)} – ${formatDateShort(summary.range.to)}` : '—'}
        {summary && summary.streak.current >= 3 ? ' · Keep the run going.' : ''}
      </p>
    </div>
  );
}
