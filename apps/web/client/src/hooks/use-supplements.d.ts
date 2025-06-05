import type { InsertSupplement } from '@core/db';
export declare function useSupplements(): {
  supplements: SelectSupplement[];
  isLoading: boolean;
  error: Error | null;
  addSupplement: import('@tanstack/react-query').UseMutateAsyncFunction<
    SelectSupplement,
    Error,
    InsertSupplement,
    unknown
  >;
  updateSupplement: import('@tanstack/react-query').UseMutateAsyncFunction<
    SelectSupplement,
    Error,
    {
      id: number;
      data: Partial<InsertSupplement>;
    },
    unknown
  >;
  deleteSupplement: import('@tanstack/react-query').UseMutateAsyncFunction<
    void,
    Error,
    number,
    unknown
  >;
};
//# sourceMappingURL=use-supplements.d.ts.map
