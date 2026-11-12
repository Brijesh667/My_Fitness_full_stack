export const STALE_AFTER_MS = 4 * 60 * 60 * 1000;

export function elapsedMs(session, now = Date.now()) {
  if (!session) return 0;
  const base = session.accumulatedMs ?? 0;
  if (!session.timerRunning || !session.lastResumeAt) return base;

  const resumeAt = new Date(session.lastResumeAt).getTime();
  return base + Math.max(0, now - resumeAt);
}

export function isStale(session, now = Date.now()) {
  if (!session || session.status !== 'in_progress' || !session.lastActivityAt) return false;
  return now - new Date(session.lastActivityAt).getTime() > STALE_AFTER_MS;
}
