import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import type {
  AssistantResult,
  DietItem,
  DietLog,
  DietLogResponse,
  DietMeal,
  DietPlan
} from '@/lib/types';
import type { MealType } from '@/lib/dates';

export function useDietPlan() {
  return useQuery({
    queryKey: ['diet-plan'],
    queryFn: () => apiGet<{ plan: DietPlan | null }>('/diet/plan').then((data) => data.plan)
  });
}

export function useDietLog(date: string) {
  return useQuery({
    queryKey: ['diet-log', date],
    queryFn: () => apiGet<DietLogResponse>('/diet/log', { params: { date } })
  });
}

export function useSaveDietLog(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (meals: {
      planMealId?: string | null;
      type: MealType;
      status: 'eaten' | 'skipped' | 'modified';
      items: DietItem[];
    }[]) =>
      apiPut<{ log: DietLog }>(`/diet/log?date=${date}`, { meals }).then((data) => data.log),
    onSuccess: (log) => {
      queryClient.setQueryData(['diet-log', date], { log, exists: true } satisfies DietLogResponse);
      queryClient.invalidateQueries({ queryKey: ['diet-analytics'] });
    }
  });
}

export function useUpsertDietPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plan: {
      name: string;
      goal: DietPlan['goal'];
      dailyTargets: DietPlan['dailyTargets'];
      days: { day: DietPlan['days'][number]['day']; meals: DietMeal[] }[];
      source: 'manual' | 'ai';
      citations?: { source: string; chunkId: string }[];
    }) => apiPut<{ plan: DietPlan }>('/diet/plan', plan).then((data) => data.plan),
    onSuccess: (plan) => {
      queryClient.setQueryData(['diet-plan'], plan);
      queryClient.invalidateQueries({ queryKey: ['diet-log'] });
      queryClient.invalidateQueries({ queryKey: ['diet-analytics'] });
    }
  });
}

export interface AssistantUsage {
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
}

export function useAssistantUsage() {
  return useQuery({
    queryKey: ['assistant-usage'],
    queryFn: () => apiGet<AssistantUsage>('/diet/assistant/usage')
  });
}

export function useGenerateDiet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiPost<AssistantResult>('/diet/assistant/generate', payload, { timeout: 115_000 }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['assistant-usage'] });
    }
  });
}
