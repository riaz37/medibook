/**
 * Base Service Class
 * Provides common functionality for all services including error handling and API communication
 */

import type { ApiError } from "@/lib/types";

export class ApiException extends Error {
  constructor(
    public message: string,
    public status?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "ApiException";
  }
}

export abstract class BaseService {
  protected baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl || (typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  }

  /**
   * Generic GET request
   */
  protected async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
    });
  }

  /**
   * Generic POST request
   */
  protected async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Generic PUT request
   */
  protected async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Generic DELETE request
   */
  protected async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }

  /**
   * Generic PATCH request
   */
  protected async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Core request method with error handling, retry logic, and interceptors
   */
  private async request<T>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Apply request interceptors (e.g., add auth headers)
    const interceptedOptions = await this.applyRequestInterceptors({
      ...options,
      headers: {
        ...this.getDefaultHeaders(),
        ...options.headers,
      },
    });

    try {
      const response = await fetch(url, {
        ...interceptedOptions,
        cache: interceptedOptions.cache || (typeof window === "undefined" ? "no-store" : undefined),
      });

      // Handle 401 Unauthorized - Refresh Token Logic
      if (response.status === 401 && retryCount < 1 && !endpoint.includes("/auth/refresh")) {
        try {
          // Attempt to refresh the token
          const refreshResponse = await fetch(`${this.baseUrl}/api/auth/refresh`, {
            method: "POST",
          });

          if (refreshResponse.ok) {
            // Token refreshed successfully, retry original request
            return this.request<T>(endpoint, options, retryCount + 1);
          }
        } catch (refreshError) {
          // Refresh failed, proceed to throw the original 401 error
          console.error("Token refresh failed:", refreshError);
        }
      }

      // Apply response interceptors
      const processedResponse = await this.applyResponseInterceptors(response);

      if (!processedResponse.ok) {
        const errorData = await this.parseErrorResponse(processedResponse);
        // Extract error message - prefer error field, fallback to message
        const errorMessage = errorData.error || errorData.message || `Request failed with status ${processedResponse.status}`;
        
        // If there are validation details, format them nicely
        let formattedMessage = errorMessage;
        if (errorData.details && errorData.details.length > 0) {
          const detailMessages = errorData.details.map(d => `${d.field}: ${d.message}`).join(", ");
          formattedMessage = `${errorMessage}. ${detailMessages}`;
        }
        
        throw new ApiException(
          formattedMessage,
          processedResponse.status,
          errorData
        );
      }

      // Handle empty responses
      const contentType = processedResponse.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await processedResponse.json();
        return this.transformResponse<T>(data);
      }

      return {} as T;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }

      // Handle network errors or other exceptions
      throw new ApiException(
        error instanceof Error ? error.message : "An unexpected error occurred",
        undefined,
        error
      );
    }
  }

  /**
   * Get default headers for all requests
   */
  private getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Add any default headers here (e.g., API version, client info)
    if (typeof window !== "undefined") {
      headers["X-Client"] = "web";
    }

    return headers;
  }

  /**
   * Apply request interceptors (override in subclasses for custom logic)
   */
  protected async applyRequestInterceptors(options: RequestInit): Promise<RequestInit> {
    // Override in subclasses to add auth tokens, logging, etc.
    return options;
  }

  /**
   * Apply response interceptors (override in subclasses for custom logic)
   */
  protected async applyResponseInterceptors(response: Response): Promise<Response> {
    // Override in subclasses for response transformation, logging, etc.
    return response;
  }

  /**
   * Transform response data (override in subclasses for custom transformation)
   */
  protected transformResponse<T>(data: unknown): T {
    return data as T;
  }

  /**
   * Parse error response from API
   */
  private async parseErrorResponse(response: Response): Promise<ApiError> {
    try {
      return await response.json();
    } catch {
      return {
        error: response.statusText || `HTTP ${response.status}`,
        status: response.status,
      };
    }
  }

  /**
   * Build query string from params
   */
  protected buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
  }
}

