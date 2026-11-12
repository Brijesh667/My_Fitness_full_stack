import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/lib/api';
import type { DayKey, Muscle } from '@/lib/dates';
import type { PlanDay, PlanExercise, WeeklyPlan } from '@/lib/types';

export function usePlan() {
  return useQuery({
    queryKey: ['plan'],
    queryFn: () => apiGet<{ plan: WeeklyPlan }>('/plan').then((data) => data.plan)
  });
}

export function useSetMuscles(day: DayKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { muscles: Muscle[]; confirm?: boolean }) =>
      apiPut<{ plan: WeeklyPlan; day: PlanDay }>(`/plan/days/${day}/muscles`, values),
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: ['plan'] });
      const previous = queryClient.getQueryData<WeeklyPlan>(['plan']);
      if (previous) {
        queryClient.setQueryData<WeeklyPlan>(['plan'], {
          ...previous,
          days: previous.days.map((entry) =>
            entry.day === day
              ? {
                  day: entry.day,
                  muscles: values.muscles.map(
                    (muscle) =>
                      entry.muscles.find((group) => group.muscle === muscle) ?? {
                        muscle,
                        exercises: []
                      }
                  )
                }
              : entry
          )
        });
      }
      return { previous };
    },
    onError: (_error, _values, context) => {
      if (context?.previous) queryClient.setQueryData(['plan'], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['plan'] });
    }
  });
}

export function useAddLibraryExercise(day: DayKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: {
      exerciseId: string;
      overrides?: { sets?: PlanExercise['sets']; description?: string };
      autoAddMuscle?: boolean;
    }) => apiPost<{ plan: WeeklyPlan; day: PlanDay }>(`/plan/days/${day}/exercises`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan'] });
    }
  });
}

export function useUpdatePlanExercise(day: DayKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: {
      planExerciseId: string;
      name?: string;
      description?: string;
      sets?: PlanExercise['sets'];
    }) =>
      apiPatch<{ plan: WeeklyPlan; day: PlanDay }>(
        `/plan/days/${day}/exercises/${values.planExerciseId}`,
        {
          name: values.name,
          description: values.description,
          sets: values.sets
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan'] });
    }
  });
}

export function useRemovePlanExercise(day: DayKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planExerciseId: string) =>
      apiDelete(`/plan/days/${day}/exercises/${planExerciseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan'] });
    }
  });
}
