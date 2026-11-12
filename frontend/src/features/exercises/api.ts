import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import type { Muscle } from '@/lib/dates';
import type { ExerciseList } from '@/lib/types';

export interface ExerciseQuery {
  search?: string;
  muscle?: Muscle;
  source: 'all' | 'library' | 'mine';
  page: number;
  limit?: number;
}

export function useExercises(query: ExerciseQuery) {
  return useQuery({
    queryKey: ['exercises', query],
    queryFn: () =>
      apiGet<ExerciseList>('/exercises', {
        params: {
          ...(query.search ? { search: query.search } : {}),
          ...(query.muscle ? { muscle: query.muscle } : {}),
          source: query.source,
          page: query.page,
          limit: query.limit ?? 20
        }
      }),
    placeholderData: keepPreviousData
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: {
      name: string;
      targetMuscle: Muscle;
      description?: string;
      sets: { tag: 'normal' | 'failure'; description?: string; repetitions: number }[];
      links: { label?: string; url: string }[];
    }) => apiPost<{ exercise: unknown }>('/exercises', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    }
  });
}
