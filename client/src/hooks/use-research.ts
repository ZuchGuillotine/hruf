
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type ResearchDocument = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  imageUrls: string[];
  publishedAt: string;
  authors: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export const useResearch = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch all research documents
  const { data: researchDocuments, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["researchDocuments"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/research");
        if (!response.ok) {
          throw new Error("Failed to fetch research documents");
        }
        return response.json() as Promise<ResearchDocument[]>;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch research documents");
        return [] as ResearchDocument[];
      }
    },
  });

  // Fetch a single research document by slug
  const getResearchBySlug = (slug: string) => {
    return useQuery({
      queryKey: ["researchDocument", slug],
      queryFn: async () => {
        try {
          const response = await fetch(`/api/research/${slug}`);
          if (!response.ok) {
            throw new Error("Failed to fetch research document");
          }
          return response.json() as Promise<ResearchDocument>;
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to fetch research document");
          throw err;
        }
      },
    });
  };

  // Admin functions for managing research documents
  const createResearchMutation = useMutation({
    mutationFn: async (newDocument: Omit<ResearchDocument, "id" | "slug" | "createdAt" | "updatedAt" | "publishedAt">) => {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newDocument),
      });

      if (!response.ok) {
        throw new Error("Failed to create research document");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["researchDocuments"] });
    },
  });

  return {
    researchDocuments,
    isLoadingDocuments,
    error,
    getResearchBySlug,
    createResearch: createResearchMutation.mutate,
    isCreating: createResearchMutation.isPending,
  };
};
