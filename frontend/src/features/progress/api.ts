import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { todayKey } from '@/lib/dates';
import type { AnalyticsSummary, HeatmapResponse } from '@/lib/types';

export function useAnalytics(range: 'week' | 'month') {
  return useQuery({
    queryKey: ['analytics', range],
    queryFn: () =>
      apiGet<AnalyticsSummary>('/analytics/summary', { params: { range, date: todayKey() } })
  });
}

export function useHeatmap(days = 120) {
  return useQuery({
    queryKey: ['analytics', 'heatmap', days],
    queryFn: () => apiGet<HeatmapResponse>('/analytics/heatmap', { params: { days } })
  });
}
