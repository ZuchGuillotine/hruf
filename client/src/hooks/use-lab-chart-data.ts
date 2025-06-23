import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
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
        console.log('🔍 Fetching lab chart data from /api/labs/chart-data');
        const response = await fetch('/api/labs/chart-data', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('📡 API Response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error:', errorText);
          throw new Error(`Failed to fetch lab chart data: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('📊 Raw API Data:', {
          success: data.success,
          dataLength: data.data?.length || 0,
          sampleData: data.data?.slice(0, 3),
          pagination: data.pagination
        });
        return data;
      } catch (error) {
        console.error('🚨 Fetch Error:', error);
        throw error;
      }
    },
    select: (response) => {
      console.log('🔄 Processing API response:', response);
      
      const biomarkers = new Map<string, Array<{
        value: number;
        testDate: string;
        unit: string;
      }>>();

      const categoriesMap: Record<string, string> = {};
      let filteredCount = 0;

      if (!response.data || !Array.isArray(response.data)) {
        console.warn('⚠️ No data array in response');
        return {
          series: [],
          allBiomarkers: [],
          categories: {}
        };
      }

      const allBiomarkers = Array.from(new Set(response.data.map(biomarker => biomarker.name)));
      console.log('📋 Found biomarkers:', allBiomarkers);

      response.data.forEach(biomarker => {
        // Very minimal filtering - only exclude truly invalid values
        if (biomarker.value == null || isNaN(biomarker.value)) {
          filteredCount++;
          console.warn('🚫 Filtered invalid biomarker:', biomarker);
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

      console.log('✅ Processed data:', {
        filteredCount,
        seriesCount: allSeries.length,
        biomarkersWithData: allSeries.map(s => `${s.name} (${s.points.length} points)`),
        categories: categoriesMap
      });

      return {
        series: allSeries,
        allBiomarkers: allBiomarkers,
        categories: categoriesMap
      };
    },
  });

  const getSeriesByName = useCallback((name: string): Series | undefined => {
    return query.data?.series.find(s => s.name === name);
  }, [query.data?.series]);

  return {
    ...query,
    getSeriesByName
  };
}
