
// Add this type if it doesn't already exist in your types file
export interface ResearchDocument {
  id: string;
  title: string;
  slug: string;
  summary: string;
  excerpt?: string;
  content: string;
  authors: string[];
  publishedAt: string;
  updatedAt?: string;
  thumbnailUrl?: string;
  tags: string[];
}

export interface Message {
  role: "system" | "user" | "assistant";
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