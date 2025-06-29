import type { ApiClient } from '../client';
import type { LogSummary } from '../types';

/**
 * Summary API endpoints
 */
export class SummariesEndpoints {
  constructor(private client: ApiClient) {}

  /**
   * Get user's summaries
   */
  async getSummaries(params?: {
    type?: 'daily' | 'weekly';
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<LogSummary[]> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    
    const query = searchParams.toString();
    const endpoint = query ? `/api/summaries?${query}` : '/api/summaries';
    
    return this.client.get(endpoint);
  }

  /**
   * Trigger summary generation
   */
  async triggerSummary(data: {
    type: 'daily' | 'weekly';
    startDate: string;
    endDate: string;
  }): Promise<LogSummary> {
    return this.client.post('/api/summaries/trigger', data);
  }

  /**
   * Get latest daily summary
   */
  async getLatestDailySummary(): Promise<LogSummary | null> {
    const summaries = await this.getSummaries({ 
      type: 'daily', 
      limit: 1 
    });
    return summaries.length > 0 ? summaries[0] : null;
  }

  /**
   * Get latest weekly summary
   */
  async getLatestWeeklySummary(): Promise<LogSummary | null> {
    const summaries = await this.getSummaries({ 
      type: 'weekly', 
      limit: 1 
    });
    return summaries.length > 0 ? summaries[0] : null;
  }
}