import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import type { TodayResponse, WorkoutSession } from '@/lib/types';

export function useToday(date: string) {
  return useQuery({
    queryKey: ['session-today', date],
    queryFn: () => apiGet<TodayResponse>('/sessions/today', { params: { date } }),
    staleTime: 10_000
  });
}

function updateToday(
  queryClient: ReturnType<typeof useQueryClient>,
  date: string,
  session: WorkoutSession
) {
  queryClient.setQueryData<TodayResponse>(['session-today', date], (previous) => ({
    session,
    preview: previous?.preview ?? null
  }));
}

export function useStartSession(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<{ session: WorkoutSession }>('/sessions/start', { date }),
    onSuccess: (data) => {
      updateToday(queryClient, date, data.session);
      queryClient.invalidateQueries({ queryKey: ['plan'] });
    }
  });
}

export function useTimerAction(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { sessionId: string; action: 'start' | 'pause' | 'resume' }) =>
      apiPost<{ session: WorkoutSession }>(`/sessions/${values.sessionId}/timer`, {
        action: values.action
      }),
    onSuccess: (data) => {
      updateToday(queryClient, date, data.session);
    }
  });
}

export function useStartExercise(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { sessionId: string; planExerciseId: string }) =>
      apiPost<{ session: WorkoutSession }>(
        `/sessions/${values.sessionId}/exercises/${values.planExerciseId}/start`
      ),
    onSuccess: (data) => {
      updateToday(queryClient, date, data.session);
    }
  });
}

export function useUpdateSet(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: {
      sessionId: string;
      planExerciseId: string;
      setIndex: number;
      completed: boolean;
      actualReps?: number;
      weightKg?: number;
    }) =>
      apiPatch<{ session: WorkoutSession }>(
        `/sessions/${values.sessionId}/exercises/${values.planExerciseId}/sets/${values.setIndex}`,
        {
          completed: values.completed,
          ...(values.actualReps !== undefined ? { actualReps: values.actualReps } : {}),
          ...(values.weightKg !== undefined ? { weightKg: values.weightKg } : {})
        }
      ),
    onSuccess: (data) => {
      updateToday(queryClient, date, data.session);
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    }
  });
}

export function useSkipExercise(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { sessionId: string; planExerciseId: string }) =>
      apiPost<{ session: WorkoutSession }>(
        `/sessions/${values.sessionId}/exercises/${values.planExerciseId}/skip`
      ),
    onSuccess: (data) => {
      updateToday(queryClient, date, data.session);
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    }
  });
}

export function useFinishSession(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiPost<{ session: WorkoutSession }>(`/sessions/${sessionId}/finish`),
    onSuccess: (data) => {
      updateToday(queryClient, date, data.session);
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['diet-analytics'] });
    }
  });
}

export function useDeleteSession(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => apiDelete(`/sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-today', date] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    }
  });
}
