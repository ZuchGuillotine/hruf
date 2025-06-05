/**
 * Research document interface that matches the database schema
 */
export interface ResearchDocument {
  id: number;
  title: string;
  slug: string;
  summary: string;
  excerpt?: string;
  content: string;
  authors: string;
  imageUrls?: string[];
  thumbnailUrl?: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
}
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  thumbnailUrl: string;
  publishedAt: string;
  slug: string;
  updatedAt?: string;
}
//# sourceMappingURL=types.d.ts.map
