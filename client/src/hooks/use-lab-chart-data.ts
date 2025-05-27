
import { useQuery } from '@tanstack/react-query';
import type { BiomarkerDataPoint, Series } from '@/types/chart';

interface ChartData {
  series: Series[];
  allBiomarkers: string[];
  categories: Record<string, string>;
}

interface ApiResponse {
  success: boolean;
  data: Array<{
    name: string;
    value: number;
    unit: string;
    testDate: string;
    category: string;
    status: string | null;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export function useLabChartData() {
  const query = useQuery<ApiResponse, Error, ChartData>({
    queryKey: ['labChartData'],
    retry: 2,
    retryDelay: 1000,
    queryFn: async () => {
      try {
        const response = await fetch('/api/labs/chart-data', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch lab chart data');
        }

        return response.json();
      } catch (error) {
        throw error;
      }
    },
    select: (response) => {
      const biomarkers = new Map<string, Array<{
        value: number;
        testDate: string;
        unit: string;
      }>>();

      const categoriesMap: Record<string, string> = {};

      response.data.forEach(biomarker => {
        const series = biomarkers.get(biomarker.name) || [];
        series.push({
          value: biomarker.value,
          testDate: biomarker.testDate,
          unit: biomarker.unit
        });
        biomarkers.set(biomarker.name, series);

        if (biomarker.category) {
          categoriesMap[biomarker.name] = biomarker.category;
        }
      });

      const allSeries = Array.from(biomarkers.entries()).map(([name, points]) => ({
        name,
        points: points.sort((a, b) => 
          new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
        ),
        unit: points[0]?.unit || '',
        category: categoriesMap[name] || 'other'
      }));

      return {
        series: allSeries,
        allBiomarkers: allSeries.map(s => s.name),
        categories: categoriesMap
      };
    },
    staleTime: 5 * 60 * 1000
  });

  const getSeriesByName = (name: string): Series | undefined => {
    return query.data?.series.find(s => s.name === name);
  };

  return {
    ...query,
    getSeriesByName
  };
}
