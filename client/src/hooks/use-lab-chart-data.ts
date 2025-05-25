
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
    value: number | string;
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
      const searchParams = new URLSearchParams(window.location.search);
      const biomarkers = searchParams.get('biomarkers')?.split(',').filter(Boolean) || [];
      
      const response = await fetch(`/api/labs/chart-data${biomarkers.length ? `?biomarkers=${biomarkers.join(',')}` : ''}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lab chart data');
      }

      const result = await response.json();
      if (!result.success || !Array.isArray(result.data)) {
        throw new Error('Invalid data format received');
      }

      return result;
    },
    select: (response) => {
      const biomarkers = new Map<string, Array<{
        value: number;
        testDate: string;
        unit: string;
        status?: string;
      }>>();

      const categoriesMap: Record<string, string> = {};

      console.log('Raw API response:', response);

      // First pass: Validate and convert data
      const validData = response.data.filter(biomarker => {
        const value = typeof biomarker.value === 'string' 
          ? parseFloat(biomarker.value) 
          : biomarker.value;
        const isValid = !isNaN(value) && biomarker.name && biomarker.unit;
        if (!isValid) {
          console.warn('Invalid biomarker data:', biomarker);
        }
        return isValid;
      });

      console.log('Valid data after filtering:', validData);

      // Second pass: Group by biomarker name
      validData.forEach(biomarker => {
        const value = typeof biomarker.value === 'string' 
          ? parseFloat(biomarker.value) 
          : biomarker.value;
        
        const series = biomarkers.get(biomarker.name) || [];
        series.push({
          value,
          testDate: biomarker.testDate,
          unit: biomarker.unit,
          status: biomarker.status || 'Normal'
        });
        biomarkers.set(biomarker.name, series);

        // Store category information
        if (biomarker.category) {
          categoriesMap[biomarker.name] = biomarker.category;
        }
      });

      console.log('Grouped biomarkers:', biomarkers);

      const allSeries = Array.from(biomarkers.entries()).map(([name, points]) => {
        // Sort points by date
        const sortedPoints = points.sort((a, b) => 
          new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
        );

        // Calculate min/max for Y-axis scaling
        const values = points.map(p => p.value);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const yAxisDomain = [
          Math.max(0, minValue - (maxValue - minValue) * 0.1),
          maxValue + (maxValue - minValue) * 0.1
        ];

        const series = {
          name,
          points: sortedPoints,
          unit: points[0]?.unit || '',
          category: categoriesMap[name] || 'other',
          yAxisDomain,
          latestValue: sortedPoints[sortedPoints.length - 1]?.value
        };

        console.log(`Series for ${name}:`, series);
        return series;
      });

      const result = {
        series: allSeries,
        allBiomarkers: allSeries.map(s => s.name),
        categories: categoriesMap
      };

      console.log('Final transformed data:', result);
      return result;
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
