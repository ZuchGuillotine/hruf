
import { useQuery } from '@tanstack/react-query';
import type { Series } from '@/types/chart';

interface ChartEntry {
  name: string;
  value: number;
  unit: string;
  testDate: string;
  category?: string;
}

interface ChartApiResponse {
  success: boolean;
  data: ChartEntry[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface UseLabChartDataReturn {
  series: Series[];
  allBiomarkers: string[];
  categories: Record<string, string>;
}

export function useLabChartData() {
  return useQuery<ChartApiResponse, Error, UseLabChartDataReturn>({
    queryKey: ['labChartData'],
    queryFn: async () => {
      const response = await fetch('/api/labs/chart-data', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch lab chart data');
      }
      const json: ChartApiResponse = await response.json();
      if (!json.success) {
        throw new Error('API returned unsuccessful');
      }

      // Group entries by biomarker name
      const biomarkerMap = new Map<string, { points: { testDate: string; value: number }[]; unit: string; category?: string }>();
      
      for (const entry of json.data) {
        const existing = biomarkerMap.get(entry.name) ?? { points: [], unit: entry.unit, category: entry.category };
        existing.points.push({ testDate: entry.testDate, value: entry.value });
        biomarkerMap.set(entry.name, existing);
      }

      // Convert to series format
      const series: Series[] = Array.from(biomarkerMap.entries()).map(([name, { points, unit, category }]) => ({
        name,
        unit,
        category: category || 'other',
        points: points.sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime())
      }));

      // Extract categories and biomarker names
      const allBiomarkers = series.map(s => s.name);
      const categories: Record<string, string> = Object.fromEntries(
        series.map(s => [s.name, s.category])
      );

      return { series, allBiomarkers, categories };
    },
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true
  });
}
