/**
 * Centralized React Query Configuration
 * Provides consistent query client setup with default options
 */

import { QueryClient } from "@tanstack/react-query";
import { API_CONFIG } from "@/lib/constants";

/**
 * Default query options for all queries
 */
export const defaultQueryOptions = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  retry: API_CONFIG.RETRY_ATTEMPTS,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
} as const;

/**
 * Create a configured query client
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: defaultQueryOptions,
      mutations: {
        retry: 1, // Mutations typically shouldn't retry
        onError: (error) => {
          // Centralized error logging
          console.error("Mutation error:", error);
        },
      },
    },
  });
}

