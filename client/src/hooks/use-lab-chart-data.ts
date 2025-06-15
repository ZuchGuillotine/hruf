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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    queryFn: async () => {
      try {
        const response = await fetch('/api/labs/chart-data', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch lab chart data: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return data;
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

      if (!response.data || !Array.isArray(response.data)) {
        return {
          series: [],
          allBiomarkers: [],
          categories: {}
        };
      }

      const allBiomarkers = Array.from(new Set(response.data.map(biomarker => biomarker.name)));

      response.data.forEach(biomarker => {
        // Very minimal filtering - only exclude truly invalid values
        if (biomarker.value == null || isNaN(biomarker.value)) {
          return;
        }
        
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

      console.log('Filtered out', filteredCount, 'invalid biomarkers');
      console.log('Final processed series:', allSeries.length, 'biomarkers with data');
      console.log('Sample series data:', allSeries.slice(0, 2));

      return {
        series: allSeries,
        allBiomarkers: allBiomarkers,
        categories: categoriesMap
      };
    },
  });

  const getSeriesByName = (name: string): Series | undefined => {
    return query.data?.series.find(s => s.name === name);
  };

  return {
    ...query,
    getSeriesByName
  };
}
