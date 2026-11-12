import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Moon,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/error-state';
import { useMe } from '@/features/auth/api';
import { usePlan } from '@/features/plan/api';
import { useStartSession, useToday } from '@/features/workout/api';
import {
  MUSCLE_LABELS,
  dayKeyFromDateKey,
  formatDateLong,
  todayKey
} from '@/lib/dates';
import { formatTimer } from '@/lib/utils';
import { getApiError } from '@/lib/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: user } = useMe();
  const planQuery = usePlan();
  const date = todayKey();
  const todayQuery = useToday(date);
  const startSession = useStartSession(date);

  const plan = planQuery.data;
  const isNewUser = plan ? plan.days.every((day) => day.muscles.length === 0) : false;

  if (planQuery.isLoading || todayQuery.isLoading) {
    return (
      <div className="container-page space-y-4 py-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
        <Skeleton className="mt-4 h-56 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (planQuery.isError || todayQuery.isError) {
    return (
      <div className="container-page py-6">
        <ErrorState
          error={planQuery.error ?? todayQuery.error}
          onRetry={() => {
            planQuery.refetch();
            todayQuery.refetch();
          }}
        />
      </div>
    );
  }

  if (isNewUser) {
    return (
      <div className="container-page flex min-h-[70dvh] items-center py-10">
        <div className="mx-auto w-full max-w-xl animate-fade-up">
          <p className="text-sm text-muted-foreground">Welcome, {user?.name?.split(' ')[0] ?? 'there'}.</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Let’s build your week first.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Choose the muscles you train each day. After that, today’s workout and progress
            will show up here.
          </p>
          <GradientButton
            size="lg"
            className="mt-6 w-full sm:w-auto"
            onClick={() => navigate('/plan')}
          >
            <CalendarDays className="h-4 w-4" /> Set your weekly workout plan
          </GradientButton>
        </div>
      </div>
    );
  }

  const session = todayQuery.data?.session ?? null;
  const preview = todayQuery.data?.preview ?? null;
  const day = dayKeyFromDateKey(date);
  const dayKey = session?.dayKey ?? preview?.day ?? day;
  const isRestDay = !session && Boolean(preview?.isRestDay);
  const muscles = session?.muscles ?? preview?.muscles ?? [];
  const plannedSets = session?.plannedSets ?? preview?.plannedSets ?? 0;
  const inProgress = session?.status === 'in_progress';
  const completed = session?.status === 'completed';

  const onStart = () => {
    startSession.mutate(undefined, {
      onSuccess: () => navigate('/workout'),
      onError: (error) => toast.error(getApiError(error).message)
    });
  };

  return (
    <div className="container-page py-6 sm:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {formatDateLong(date)}
          </p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
            Today · {muscles.length ? muscles.map((group) => MUSCLE_LABELS[group.muscle]).join(' · ') : 'Rest'}
          </h1>
        </div>
        <Link to="/plan">
          <Button variant="outline" size="sm">
            <CalendarDays className="h-4 w-4" /> Weekly plan
          </Button>
        </Link>
      </header>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="relative overflow-hidden border-primary/20 p-5 sm:p-6">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_80%_at_100%_0%,rgba(190,242,100,0.12),transparent_65%)]"
            aria-hidden
          />

          {isRestDay ? (
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Moon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-semibold">Rest day</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Nothing is scheduled for today. Recovery is part of the plan — keep it that way,
                or adjust today in the weekly plan.
              </p>
              <Link to={`/plan/${dayKey}`} className="mt-5 inline-block">
                <Button variant="outline">Open {dayKey} plan</Button>
              </Link>
            </div>
          ) : inProgress ? (
            <div className="relative">
              <Badge variant="success">In progress</Badge>
              <h2 className="mt-3 text-xl font-semibold">Continue where you left off</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {session?.completedSets} of {session?.plannedSets} sets done ·{' '}
                {formatTimer(session?.elapsedMs ?? 0)} on the timer
              </p>
              <div className="mt-4 max-w-md">
                <Progress value={session?.completionPct ?? 0} label="Workout completion" />
                <p className="mt-1.5 text-xs text-muted-foreground">{session?.completionPct ?? 0}% complete</p>
              </div>
              <GradientButton size="lg" className="mt-5 w-full sm:w-auto" onClick={() => navigate('/workout')}>
                <Play className="h-4 w-4" /> Continue workout
              </GradientButton>
            </div>
          ) : completed ? (
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/15 text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-semibold">Workout complete</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {session?.completedSets} of {session?.plannedSets} sets ·{' '}
                {formatTimer((session?.durationSec ?? 0) * 1000)} gym time
              </p>
              <Button className="mt-5" onClick={() => navigate('/workout')}>
                View summary <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Badge variant="outline" className="border-primary/30 text-primary">
                Today’s session
              </Badge>
              <h2 className="mt-3 text-xl font-semibold">Your workout is ready</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {plannedSets} planned set{plannedSets === 1 ? '' : 's'} across {muscles.length} muscle
                group{muscles.length === 1 ? '' : 's'}.
              </p>
              <GradientButton
                size="lg"
                className="mt-5 w-full sm:w-auto"
                loading={startSession.isPending}
                onClick={onStart}
              >
                <Play className="h-4 w-4" /> Start today
              </GradientButton>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Target muscles</h2>
            <Dumbbell className="h-4 w-4 text-muted-foreground" aria-hidden />
          </div>

          {muscles.length ? (
            <ul className="mt-3 space-y-2">
              {muscles.map((group) => (
                <li key={group.muscle} className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm">
                  <span className="font-medium">{MUSCLE_LABELS[group.muscle]}</span>
                  <span className="text-xs text-muted-foreground">
                    {group.exercises.length} exercise{group.exercises.length === 1 ? '' : 's'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No muscles scheduled today.</p>
          )}

          <div className="mt-4 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            {inProgress
              ? 'Timer keeps running while you train.'
              : completed
                ? `Logged ${formatTimer((session?.durationSec ?? 0) * 1000)} of gym time.`
                : 'The timer starts automatically with your first exercise.'}
          </div>
        </Card>
      </div>

      {preview && !session && !preview.isRestDay ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Starting today takes a snapshot of your plan. Later plan edits will not rewrite this
          session.
        </p>
      ) : null}
    </div>
  );
}
