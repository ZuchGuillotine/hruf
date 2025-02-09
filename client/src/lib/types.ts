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