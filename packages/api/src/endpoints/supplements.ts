import type { ApiClient } from '../client';
import type { 
  Supplement, 
  CreateSupplementData, 
  UpdateSupplementData,
  SupplementSearchResult,
  SupplementLog,
  CreateSupplementLogData,
  SupplementLogsResponse,
  SupplementStreak
} from '../types';

/**
 * Supplements API endpoints
 */
export class SupplementsEndpoints {
  constructor(private client: ApiClient) {}

  /**
   * Get user's supplements
   */
  async getSupplements(): Promise<Supplement[]> {
    return this.client.get('/api/supplements');
  }

  /**
   * Create a new supplement
   */
  async createSupplement(data: CreateSupplementData): Promise<Supplement> {
    return this.client.post('/api/supplements', data);
  }

  /**
   * Update a supplement
   */
  async updateSupplement(id: number, data: UpdateSupplementData): Promise<Supplement> {
    return this.client.put(`/api/supplements/${id}`, data);
  }

  /**
   * Delete a supplement
   */
  async deleteSupplement(id: number): Promise<{ message: string }> {
    return this.client.delete(`/api/supplements/${id}`);
  }

  /**
   * Search supplements in the reference database
   */
  async searchSupplements(query: string): Promise<SupplementSearchResult[]> {
    return this.client.get(`/api/supplements/search?q=${encodeURIComponent(query)}`);
  }

  /**
   * Get supplement logs for a specific date
   */
  async getSupplementLogs(date: string): Promise<SupplementLogsResponse> {
    return this.client.get(`/api/supplement-logs/${date}`);
  }

  /**
   * Save supplement logs for a day
   */
  async saveSupplementLogs(logs: CreateSupplementLogData[]): Promise<SupplementLog[]> {
    return this.client.post('/api/supplement-logs', { logs });
  }

  /**
   * Get current supplement streak
   */
  async getSupplementStreak(): Promise<SupplementStreak> {
    return this.client.get('/api/supplement-streak');
  }
}