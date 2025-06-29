import type { 
  AppUser, 
  SupplementInfo, 
  LabResultInfo,
  HealthProfile,
  ApiResponse 
} from '@hruf/shared-types';

// TODO: Replace with actual API base URL from environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

export const api = {
  // User endpoints
  user: {
    getProfile: () => fetchApi<AppUser>('/api/user/profile'),
    updateProfile: (data: Partial<HealthProfile>) => 
      fetchApi<AppUser>('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Supplements endpoints
  supplements: {
    getAll: () => fetchApi<SupplementInfo[]>('/api/supplements'),
    add: (supplement: Omit<SupplementInfo, 'id'>) =>
      fetchApi<SupplementInfo>('/api/supplements', {
        method: 'POST',
        body: JSON.stringify(supplement),
      }),
    update: (id: string, supplement: Partial<SupplementInfo>) =>
      fetchApi<SupplementInfo>(`/api/supplements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(supplement),
      }),
    delete: (id: string) =>
      fetchApi<void>(`/api/supplements/${id}`, {
        method: 'DELETE',
      }),
  },

  // Lab results endpoints
  labs: {
    getAll: () => fetchApi<LabResultInfo[]>('/api/labs'),
    upload: (formData: FormData) =>
      fetchApi<LabResultInfo>('/api/labs/upload', {
        method: 'POST',
        body: formData,
        headers: {}, // Let fetch set Content-Type for FormData
      }),
  },

  // Authentication endpoints
  auth: {
    login: (email: string, password: string) =>
      fetchApi<{ user: AppUser; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string, name: string) =>
      fetchApi<{ user: AppUser; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }),
    logout: () =>
      fetchApi<void>('/api/auth/logout', {
        method: 'POST',
      }),
  },
};

export { ApiError };