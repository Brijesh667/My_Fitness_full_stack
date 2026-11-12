import { useSyncExternalStore } from 'react';

export interface RequestTracker {
  id: number;
  timer: number;
}

const slowRequests = new Set<number>();
const listeners = new Set<() => void>();
let nextId = 0;

function emit() {
  for (const listener of listeners) listener();
}

export function beginRequest(): RequestTracker {
  const id = (nextId += 1);
  const timer = window.setTimeout(() => {
    slowRequests.add(id);
    emit();
  }, 5000);
  return { id, timer };
}

export function endRequest(tracker?: RequestTracker) {
  if (!tracker) return;
  window.clearTimeout(tracker.timer);
  if (slowRequests.delete(tracker.id)) emit();
}

export function subscribeRequestStatus(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getServerSlowSnapshot() {
  return slowRequests.size > 0;
}

export function useServerSlow() {
  return useSyncExternalStore(subscribeRequestStatus, getServerSlowSnapshot, () => false);
}
