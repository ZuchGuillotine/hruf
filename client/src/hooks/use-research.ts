
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ResearchDocument {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  imageUrls?: string[];
  authors?: string;
  tags?: string[];
}

export function useResearch() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch all research documents
  const {
    data: researchDocuments,
    isLoading: isLoadingDocuments,
    error: docsError
  } = useQuery<ResearchDocument[]>({
    queryKey: ['researchDocuments'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/research');
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch research documents');
        }
        return res.json();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch research documents';
        setError(errorMessage);
        throw err;
      }
    },
    retry: 1
  });

  // Create a function to get a specific document by slug
  const getResearchBySlug = (slug?: string) => {
    return useQuery<ResearchDocument>({
      queryKey: ['researchDocument', slug],
      queryFn: async () => {
        if (!slug) throw new Error('Slug is required');
        
        try {
          const res = await fetch(`/api/research/${slug}`);
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'Research document not found');
          }
          return res.json();
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch research document';
          console.error('Error fetching research document:', errorMessage);
          throw err;
        }
      },
      enabled: !!slug,
      retry: 1
    });
  };

  return {
    researchDocuments,
    isLoadingDocuments,
    error: docsError ? (docsError as Error).message : error,
    getResearchBySlug
  };
}
