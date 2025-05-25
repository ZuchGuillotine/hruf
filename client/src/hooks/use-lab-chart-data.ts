
import { useQuery } from '@tanstack/react-query';
import type { BiomarkerDataPoint, Series } from '@/types/chart';
import type { ApiError } from '@/lib/types';

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
    labResultId?: number;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  hasBiomarkers?: boolean;
}

export function useLabChartData() {
  const query = useQuery<ApiResponse, ApiError, ChartData>({
    queryKey: ['labChartData'],
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format');
        }
        
        if (!data.success) {
          throw new Error(data.error || 'API request failed');
        }
        
        if (!Array.isArray(data.data)) {
          console.warn('No biomarker data available');
          return {
            success: true,
            data: [],
            pagination: data.pagination || { page: 1, pageSize: 50, total: 0 },
            hasBiomarkers: false
          };
        }

        return data;
      } catch (error) {
        console.error('Error fetching lab chart data:', error);
        throw error;
      }
    },
    select: (response) => {
      try {
        // Group biomarkers by name
        const biomarkerMap = new Map<string, Array<{
          value: number;
          testDate: string;
          unit: string;
          status?: string | null;
        }>>();

        const categoriesMap: Record<string, string> = {};

        // Process each biomarker data point
        response.data.forEach(biomarker => {
          // Validate required fields
          if (!biomarker.name || typeof biomarker.value !== 'number' || !biomarker.testDate) {
            console.warn('Invalid biomarker data point:', biomarker);
            return;
          }

          // Parse and validate value
          const value = Number(biomarker.value);
          if (isNaN(value)) {
            console.warn('Invalid biomarker value:', biomarker);
            return;
          }

          // Validate and parse date
          const testDate = new Date(biomarker.testDate);
          if (isNaN(testDate.getTime())) {
            console.warn('Invalid test date:', biomarker);
            return;
          }

          // Group by biomarker name
          const series = biomarkerMap.get(biomarker.name) || [];
          series.push({
            value,
            testDate: biomarker.testDate,
            unit: biomarker.unit || '',
            status: biomarker.status
          });
          biomarkerMap.set(biomarker.name, series);

          // Store category information
          if (biomarker.category) {
            categoriesMap[biomarker.name] = biomarker.category;
          }
        });

        // Convert map to array of series
        const allSeries = Array.from(biomarkerMap.entries()).map(([name, points]) => {
          // Sort points by date
          const sortedPoints = points.sort((a, b) => 
            new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
          );

          // Determine the most common unit for this biomarker
          const units = points.map(p => p.unit).filter(Boolean);
          const unitCounts = units.reduce((acc, unit) => {
            acc[unit] = (acc[unit] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const mostCommonUnit = Object.entries(unitCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

          return {
            name,
            points: sortedPoints.map(p => ({
              value: p.value,
              testDate: p.testDate,
              status: p.status || null
            })),
            unit: mostCommonUnit,
            category: categoriesMap[name] || 'other'
          } as Series;
        });

        // Sort series by name for consistent ordering
        allSeries.sort((a, b) => a.name.localeCompare(b.name));

        return {
          series: allSeries,
          allBiomarkers: allSeries.map(s => s.name),
          categories: categoriesMap
        };
      } catch (error) {
        console.error('Error processing chart data:', error);
        // Return empty data structure on processing error
        return {
          series: [],
          allBiomarkers: [],
          categories: {}
        };
      }
    }
  });

  const getSeriesByName = (name: string): Series | undefined => {
    return query.data?.series.find(s => s.name === name);
  };

  const getSeriesByNames = (names: string[]): Series[] => {
    if (!query.data?.series) return [];
    return query.data.series.filter(s => names.includes(s.name));
  };

  const getBiomarkersByCategory = (category: string): string[] => {
    if (!query.data) return [];
    return Object.entries(query.data.categories)
      .filter(([, cat]) => cat === category)
      .map(([name]) => name);
  };

  return {
    ...query,
    getSeriesByName,
    getSeriesByNames,
    getBiomarkersByCategory,
    // Add computed values for easy access
    totalBiomarkers: query.data?.allBiomarkers.length || 0,
    totalDataPoints: query.data?.series.reduce((sum, s) => sum + s.points.length, 0) || 0,
    categories: query.data?.categories || {},
    isEmpty: !query.data?.allBiomarkers.length
  };
}
