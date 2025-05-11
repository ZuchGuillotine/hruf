import { useQuery } from '@tanstack/react-query';
import type { BiomarkerDataPoint, Series } from '@/types/chart';

interface ChartData {
  series: Series[];
  allBiomarkers: string[];
  categories: Record<string, string>;
}

export function useLabChartData() {
  return useQuery<ChartData>({
    queryKey: ['labChartData'],
    queryFn: async () => {
      const response = await fetch('/api/labs/chart-data');
      if (!response.ok) {
        throw new Error('Failed to fetch lab chart data');
      }
      const data = await response.json();

      // Group data points by biomarker name
      const biomarkerMap = new Map<string, BiomarkerDataPoint[]>();
      data.data.forEach((point: BiomarkerDataPoint) => {
        const points = biomarkerMap.get(point.name) || [];
        points.push(point);
        biomarkerMap.set(point.name, points);
      });

      // Convert to series format
      const series: Series[] = Array.from(biomarkerMap.entries()).map(([name, points]) => ({
        name,
        unit: points[0].unit,
        category: points[0].category,
        points: points
          .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime())
          .map(p => ({ testDate: p.testDate, value: p.value }))
      }));

      // Track categories for coloring
      const categories: Record<string, string> = {};
      series.forEach(s => {
        if (s.category) {
          categories[s.name] = s.category;
        }
      });

      return {
        series,
        allBiomarkers: Array.from(biomarkerMap.keys()).sort(),
        categories
      };
    },
    staleTime: 5 * 60 * 1000 // Consider data stale after 5 minutes
  });
}