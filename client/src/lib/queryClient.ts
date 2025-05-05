import { QueryClient } from "@tanstack/react-query";

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

type GetQueryFnOptions = {
  on401?: "throw" | "returnNull";
};

// Custom fetch wrapper that works with the user authentication status
export const apiRequest = async (
  method: string,
  url: string,
  body?: any,
  options: RequestInit = {}
) => {
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: "include",
    ...options,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(url.startsWith("/") ? url : `/${url}`, config);

  if (!response.ok) {
    if (response.headers.get("Content-Type")?.includes("application/json")) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || `Error ${response.status}`);
    }
    
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }

  return response;
};

// Factory function to create query functions
export const getQueryFn = (options: GetQueryFnOptions = {}) => {
  return async ({ queryKey }: { queryKey: (string | number)[] }): Promise<any> => {
    const url = queryKey[0];
    
    try {
      const response = await apiRequest("GET", url as string);
      return await response.json();
    } catch (error: any) {
      // Handle 401 errors based on options
      if (error.message && error.message.includes("401") && options.on401 === "returnNull") {
        return undefined;
      }
      throw error;
    }
  };
};