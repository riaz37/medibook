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
   * Core request method with error handling
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        cache: options.cache || (typeof window === "undefined" ? "no-store" : undefined),
      });

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new ApiException(
          errorData.error || errorData.message || `Request failed with status ${response.status}`,
          response.status,
          errorData
        );
      }

      // Handle empty responses
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
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

