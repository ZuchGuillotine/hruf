// Export all endpoint classes
export { AuthEndpoints } from './auth';
export { SupplementsEndpoints } from './supplements';
export { ChatEndpoints } from './chat';
export { LabsEndpoints } from './labs';
export { UserEndpoints } from './user';
export { AdminEndpoints } from './admin';
export { SummariesEndpoints } from './summaries';

// Export a unified API class that combines all endpoints
import type { ApiClient } from '../client';
import { AuthEndpoints } from './auth';
import { SupplementsEndpoints } from './supplements';
import { ChatEndpoints } from './chat';
import { LabsEndpoints } from './labs';
import { UserEndpoints } from './user';
import { AdminEndpoints } from './admin';
import { SummariesEndpoints } from './summaries';

/**
 * Unified API class that provides access to all endpoints
 */
export class ApiEndpoints {
  public auth: AuthEndpoints;
  public supplements: SupplementsEndpoints;
  public chat: ChatEndpoints;
  public labs: LabsEndpoints;
  public user: UserEndpoints;
  public admin: AdminEndpoints;
  public summaries: SummariesEndpoints;

  constructor(client: ApiClient) {
    this.auth = new AuthEndpoints(client);
    this.supplements = new SupplementsEndpoints(client);
    this.chat = new ChatEndpoints(client);
    this.labs = new LabsEndpoints(client);
    this.user = new UserEndpoints(client);
    this.admin = new AdminEndpoints(client);
    this.summaries = new SummariesEndpoints(client);
  }
}