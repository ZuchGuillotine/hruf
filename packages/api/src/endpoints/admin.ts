import type { ApiClient } from '../client';
import type { 
  SupplementReference,
  CreateSupplementReferenceData,
  BlogPost,
  CreateBlogPostData,
  ResearchDocument,
  CreateResearchDocumentData
} from '../types';

/**
 * Admin API endpoints
 */
export class AdminEndpoints {
  constructor(private client: ApiClient) {}

  // Supplement Reference Management
  /**
   * Get all supplement reference data
   */
  async getSupplementReference(): Promise<SupplementReference[]> {
    return this.client.get('/api/admin/supplements');
  }

  /**
   * Create new supplement reference
   */
  async createSupplementReference(data: CreateSupplementReferenceData): Promise<SupplementReference> {
    return this.client.post('/api/admin/supplements', data);
  }

  /**
   * Update supplement reference
   */
  async updateSupplementReference(id: number, data: Partial<CreateSupplementReferenceData>): Promise<SupplementReference> {
    return this.client.put(`/api/admin/supplements/${id}`, data);
  }

  /**
   * Delete supplement reference
   */
  async deleteSupplementReference(id: number): Promise<{ message: string; supplement: SupplementReference }> {
    return this.client.delete(`/api/admin/supplements/${id}`);
  }

  // Blog Management
  /**
   * Get all blog posts (admin view)
   */
  async getBlogPosts(): Promise<BlogPost[]> {
    return this.client.get('/api/blog');
  }

  /**
   * Get blog post by slug
   */
  async getBlogPost(slug: string): Promise<BlogPost> {
    return this.client.get(`/api/blog/${slug}`);
  }

  /**
   * Create new blog post
   */
  async createBlogPost(data: CreateBlogPostData): Promise<BlogPost> {
    return this.client.post('/api/admin/blog', data);
  }

  /**
   * Update blog post
   */
  async updateBlogPost(id: string, data: Partial<CreateBlogPostData>): Promise<BlogPost> {
    return this.client.put(`/api/admin/blog/${id}`, data);
  }

  /**
   * Delete blog post
   */
  async deleteBlogPost(id: string): Promise<{ message: string }> {
    return this.client.delete(`/api/admin/blog/${id}`);
  }

  // Research Document Management
  /**
   * Get all research documents
   */
  async getResearchDocuments(): Promise<ResearchDocument[]> {
    return this.client.get('/api/research');
  }

  /**
   * Get research document by slug
   */
  async getResearchDocument(slug: string): Promise<ResearchDocument> {
    return this.client.get(`/api/research/${slug}`);
  }

  /**
   * Create new research document
   */
  async createResearchDocument(data: CreateResearchDocumentData): Promise<ResearchDocument> {
    return this.client.post('/api/admin/research', data);
  }

  /**
   * Update research document
   */
  async updateResearchDocument(id: number, data: Partial<CreateResearchDocumentData>): Promise<ResearchDocument> {
    return this.client.put(`/api/admin/research/${id}`, data);
  }

  /**
   * Delete research document
   */
  async deleteResearchDocument(id: number): Promise<{ message: string }> {
    return this.client.delete(`/api/admin/research/${id}`);
  }

  // User Management
  /**
   * Delete all non-admin users (admin only, dangerous operation)
   */
  async deleteNonAdminUsers(): Promise<{ message: string; deletedCount: number }> {
    return this.client.delete('/api/admin/users/delete-non-admin');
  }
}