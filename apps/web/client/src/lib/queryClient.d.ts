import { QueryClient } from '@tanstack/react-query';
export declare const queryClient: QueryClient;
type GetQueryFnOptions = {
  on401?: 'returnNull' | 'throw';
};
export declare function getQueryFn({
  on401,
}?: GetQueryFnOptions): ({ queryKey }: { queryKey: string[] }) => Promise<any>;
export declare function apiRequest(
  method: string,
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<Response>;
export {};
//# sourceMappingURL=queryClient.d.ts.map
