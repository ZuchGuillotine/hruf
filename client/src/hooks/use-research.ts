
import { useQuery } from '@tanstack/react-query';
import type { ResearchDocument } from '@/lib/types';

export function useResearchDocuments() {
  return useQuery<ResearchDocument[]>({
    queryKey: ['/api/research'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/research');
        if (!response.ok) {
          throw new Error(`Failed to fetch research documents: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching research documents:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useResearchDocument(slug: string | undefined) {
  return useQuery<ResearchDocument>({
    queryKey: ['/api/research', slug],
    queryFn: async () => {
      if (!slug) {
        throw new Error('Slug is required');
      }

      try {
        const response = await fetch(`/api/research/${slug}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch research document: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        console.error(`Error fetching research document with slug ${slug}:`, error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!slug, // Only run the query if slug is provided
  });
}
