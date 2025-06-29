import type { ApiClient } from '../client';
import type { 
  User,
  HealthStats,
  UpdateHealthStatsData
} from '../types';

/**
 * User profile and health stats API endpoints
 */
export class UserEndpoints {
  constructor(private client: ApiClient) {}

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<{ message: string; user: User }> {
    return this.client.post('/api/profile', data);
  }

  /**
   * Get user's health stats
   */
  async getHealthStats(): Promise<HealthStats> {
    return this.client.get('/api/health-stats');
  }

  /**
   * Update user's health stats
   */
  async updateHealthStats(data: UpdateHealthStatsData): Promise<HealthStats> {
    return this.client.post('/api/health-stats', data);
  }
}