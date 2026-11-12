import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getApiError } from '@/lib/api';
import { formatTimer } from '@/lib/utils';
import type { WorkoutSession } from '@/lib/types';
import { useTimerAction } from './api';

export function SessionTimerBar({ session, date }: { session: WorkoutSession; date: string }) {
  const timer = useTimerAction(date);
  const [now, setNow] = useState(() => Date.now());
  const anchor = useRef({ at: Date.now(), elapsed: session.elapsedMs });

  useEffect(() => {
    anchor.current = { at: Date.now(), elapsed: session.elapsedMs };
    setNow(Date.now());
  }, [session.elapsedMs, session.timerRunning]);

  useEffect(() => {
    if (!session.timerRunning) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [session.timerRunning]);

  const elapsed = session.timerRunning
    ? anchor.current.elapsed + (now - anchor.current.at)
    : session.elapsedMs;

  const onToggle = () => {
    timer.mutate(
      { sessionId: session._id, action: session.timerRunning ? 'pause' : 'start' },
      {
        onError: (error) => toast.error(getApiError(error).message)
      }
    );
  };

  return (
    <div className="sticky top-14 z-30 -mx-4 border-b bg-background/95 px-4 py-2.5 backdrop-blur-md sm:mx-0 sm:mt-3 sm:rounded-2xl sm:border">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Session timer
          </p>
          <p className="font-mono text-2xl font-semibold tabular-nums" aria-label="Elapsed gym time">
            {formatTimer(elapsed)}
          </p>
        </div>
        <Button
          size="sm"
          variant={session.timerRunning ? 'outline' : 'default'}
          onClick={onToggle}
          disabled={timer.isPending}
          className="min-w-[104px]"
        >
          {session.timerRunning ? (
            <>
              <Pause className="h-4 w-4" /> Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> {elapsed > 0 ? 'Resume' : 'Start'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
