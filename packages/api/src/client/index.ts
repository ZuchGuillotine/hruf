import type { 
  ApiClientConfig, 
  ApiError, 
  RequestMethod, 
  RequestConfig 
} from '../types';

/**
 * Platform-agnostic HTTP client configuration options
 */
export interface ApiClientOptions {
  baseURL?: string;
  timeout?: number;
  credentials?: RequestCredentials;
  headers?: Record<string, string>;
}

/**
 * Response type for API requests
 */
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

/**
 * Platform-agnostic API client for making HTTP requests
 * Works in both web browsers and React Native environments
 */
export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private credentials: RequestCredentials;
  private defaultHeaders: Record<string, string>;

  constructor(options: ApiClientOptions = {}) {
    this.baseURL = options.baseURL || '';
    this.timeout = options.timeout || 30000;
    this.credentials = options.credentials || 'include';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers
    };
  }

  /**
   * Create an API error from a failed response
   */
  private async createApiError(response: Response): Promise<ApiError> {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // Ignore JSON parsing errors
    }

    const error = new Error(
      errorData.message || 
      errorData.error || 
      `API request failed with status ${response.status}`
    ) as ApiError;
    
    error.status = response.status;
    error.response = errorData;
    
    return error;
  }

  /**
   * Make a raw HTTP request
   */
  private async makeRequest<T>(
    endpoint: string,
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    const headers = {
      ...this.defaultHeaders,
      ...config.headers
    };

    const requestInit: RequestInit = {
      method: config.method,
      headers,
      credentials: this.credentials
    };

    if (config.body && config.method !== 'GET') {
      if (config.body instanceof FormData) {
        // Remove Content-Type header for FormData (browser sets it automatically)
        if ('Content-Type' in headers) {
          delete (headers as any)['Content-Type'];
        }
        requestInit.body = config.body;
      } else {
        requestInit.body = JSON.stringify(config.body);
      }
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    requestInit.signal = controller.signal;

    try {
      const response = await fetch(url, requestInit);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw await this.createApiError(response);
      }

      let data: T;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text() as any;
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout') as ApiError;
        timeoutError.status = 408;
        throw timeoutError;
      }
      
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, config: Partial<RequestConfig> = {}): Promise<T> {
    const response = await this.makeRequest<T>(endpoint, {
      method: 'GET',
      ...config
    });
    return response.data;
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, config: Partial<RequestConfig> = {}): Promise<T> {
    const response = await this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data,
      ...config
    });
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any, config: Partial<RequestConfig> = {}): Promise<T> {
    const response = await this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data,
      ...config
    });
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, config: Partial<RequestConfig> = {}): Promise<T> {
    const response = await this.makeRequest<T>(endpoint, {
      method: 'DELETE',
      ...config
    });
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, config: Partial<RequestConfig> = {}): Promise<T> {
    const response = await this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data,
      ...config
    });
    return response.data;
  }

  /**
   * Make a streaming request (for Server-Sent Events)
   */
  async stream(endpoint: string, config: Partial<RequestConfig> = {}): Promise<ReadableStream> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    const headers = {
      ...this.defaultHeaders,
      'Accept': 'text/event-stream',
      ...config.headers
    };

    const requestInit: RequestInit = {
      method: config.method || 'GET',
      headers,
      credentials: this.credentials
    };

    if (config.body && config.method !== 'GET') {
      if (config.body instanceof FormData) {
        // Remove Content-Type header for FormData (browser sets it automatically)
        if ('Content-Type' in headers) {
          delete (headers as any)['Content-Type'];
        }
        requestInit.body = config.body;
      } else {
        requestInit.body = JSON.stringify(config.body);
      }
    }

    const response = await fetch(url, requestInit);

    if (!response.ok) {
      throw await this.createApiError(response);
    }

    if (!response.body) {
      throw new Error('No response body for streaming request');
    }

    return response.body;
  }

  /**
   * Upload files using FormData
   */
  async upload<T = any>(
    endpoint: string, 
    files: File | File[] | FormData, 
    config: Partial<RequestConfig> = {}
  ): Promise<T> {
    let formData: FormData;

    if (files instanceof FormData) {
      formData = files;
    } else {
      formData = new FormData();
      const fileArray = Array.isArray(files) ? files : [files];
      fileArray.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
    }

    const response = await this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: formData,
      ...config
    });
    
    return response.data;
  }

  /**
   * Set default headers
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Remove a default header
   */
  removeDefaultHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  /**
   * Update base URL
   */
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
  }

  /**
   * Update timeout
   */
  setTimeout(timeout: number): void {
    this.timeout = timeout;
  }
}

/**
 * Create a new API client instance
 */
export function createApiClient(options?: ApiClientOptions): ApiClient {
  return new ApiClient(options);
}

/**
 * Default API client instance
 */
export const apiClient = createApiClient();