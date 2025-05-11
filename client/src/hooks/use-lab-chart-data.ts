import { useQuery } from '@tanstack/react-query';
import type { BiomarkerDataPoint, Series } from '@/types/chart';

interface ChartData {
  series: Series[];
  allBiomarkers: string[];
  categories: Record<string, string>;
}

export function useLabChartData() {
  return useQuery<BiomarkerData>({
    queryKey: ['labChartData'],
    queryFn: async () => {
      const response = await fetch('/api/labs/chart-data');
      if (!response.ok) {
        throw new Error('Failed to fetch lab chart data');
      }
      const data = await response.json();

      // Extract biomarkers from lab results
      const biomarkers = new Map();
      data.data.forEach(result => {
        const parsedBiomarkers = result.metadata?.biomarkers?.parsedBiomarkers || [];
        parsedBiomarkers.forEach(biomarker => {
          const series = biomarkers.get(biomarker.name) || [];
          series.push({
            value: biomarker.value,
            testDate: biomarker.testDate || result.uploadedAt,
            unit: biomarker.unit
          });
          biomarkers.set(biomarker.name, series);
        });
      });

      // Convert to expected format
      const allSeries = Array.from(biomarkers.entries()).map(([name, points]) => ({
        name,
        points: points.sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime()),
        unit: points[0]?.unit || ''
      }));

      const result = {
        series: allSeries,
        allBiomarkers: allSeries.map(s => s.name)
      };
      console.log('Lab chart data response:', result);
      return result;
    },
    staleTime: 5 * 60 * 1000
  });
}