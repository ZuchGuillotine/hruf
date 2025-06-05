export interface ResearchDocument {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  authors: string[];
  imageUrls?: string[];
  tags?: string[];
  publishedAt: string;
  updatedAt?: string;
}
export declare function useResearchDocuments(): import('@tanstack/react-query').DefinedUseQueryResult<
  import('@tanstack/query-core').NoInfer<TQueryFnData>,
  Error
>;
export declare function useResearchDocument(
  slug: string | null
): import('@tanstack/react-query').DefinedUseQueryResult<
  import('@tanstack/query-core').NoInfer<TQueryFnData>,
  Error
>;
//# sourceMappingURL=use-research.d.ts.map
