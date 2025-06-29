import type { ApiClient } from '../client';
import type { 
  LabResult,
  BiomarkerDataPoint,
  LabChartData,
  PaginatedResponse
} from '../types';

/**
 * Lab results API endpoints
 */
export class LabsEndpoints {
  constructor(private client: ApiClient) {}

  /**
   * Get user's lab results
   */
  async getLabResults(): Promise<LabResult[]> {
    return this.client.get('/api/labs');
  }

  /**
   * Upload lab result files
   */
  async uploadLabResult(files: File | File[]): Promise<{ message: string }> {
    return this.client.upload('/api/labs', files);
  }

  /**
   * Delete a lab result
   */
  async deleteLabResult(id: number): Promise<{ message: string }> {
    return this.client.delete(`/api/labs/${id}`);
  }

  /**
   * Get biomarker chart data with pagination
   */
  async getLabChartData(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<BiomarkerDataPoint>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    
    const query = searchParams.toString();
    const endpoint = query ? `/api/labs/chart-data?${query}` : '/api/labs/chart-data';
    
    return this.client.get(endpoint);
  }

  /**
   * Get all biomarker chart data (handles pagination automatically)
   */
  async getAllLabChartData(): Promise<LabChartData> {
    // First request to get initial data and total count
    const firstResponse = await this.getLabChartData({ pageSize: 100, page: 1 });
    
    if (!firstResponse.pagination || !firstResponse.pagination.totalPages || firstResponse.pagination.totalPages <= 1) {
      return this.processChartData(firstResponse);
    }

    // Fetch remaining pages in parallel
    const totalPages = firstResponse.pagination.totalPages;
    const pagePromises: Promise<PaginatedResponse<BiomarkerDataPoint>>[] = [];
    
    for (let page = 2; page <= totalPages; page++) {
      pagePromises.push(this.getLabChartData({ pageSize: 100, page }));
    }

    const additionalPages = await Promise.all(pagePromises);
    
    // Combine all data
    const allData = [...firstResponse.data];
    for (const pageData of additionalPages) {
      if (pageData.success && pageData.data) {
        allData.push(...pageData.data);
      }
    }

    // Return combined response
    const combinedResponse: PaginatedResponse<BiomarkerDataPoint> = {
      ...firstResponse,
      data: allData,
      pagination: {
        ...firstResponse.pagination,
        page: 1,
        pageSize: allData.length,
        total: allData.length
      }
    };

    return this.processChartData(combinedResponse);
  }

  /**
   * Process raw biomarker data into chart format
   */
  private processChartData(response: PaginatedResponse<BiomarkerDataPoint>): LabChartData {
    if (!response.success || !response.data || !Array.isArray(response.data)) {
      return {
        series: [],
        allBiomarkers: [],
        categories: {}
      };
    }

    const biomarkers = new Map<string, Array<{
      value: number;
      testDate: string;
      unit: string;
    }>>();

    const categoriesMap: Record<string, string> = {};
    const allBiomarkers = Array.from(new Set(response.data.map(biomarker => biomarker.name)));

    response.data.forEach(biomarker => {
      // Validate required fields
      if (!biomarker.name || biomarker.value == null || isNaN(Number(biomarker.value)) || !biomarker.testDate) {
        return;
      }
      
      const series = biomarkers.get(biomarker.name) || [];
      series.push({
        value: Number(biomarker.value),
        testDate: biomarker.testDate,
        unit: biomarker.unit || ''
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
      allBiomarkers,
      categories: categoriesMap
    };
  }
}