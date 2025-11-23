/**
 * Base Server Service Class
 * Provides common functionality for all server-side services including Prisma access,
 * error handling, transaction support, and logging utilities.
 * 
 * This is server-only and should never be imported in client components.
 * 
 * Note: This file does not use "use server" because it exports classes, not Server Actions.
 * Server Actions can only export async functions. This base class is used by server-side
 * services and API routes, not as a Server Action.
 */

import prisma from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { cacheService, CacheTTL } from "./cache.service";

/**
 * Custom error class for server service operations
 */
export class ServerServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "ServerServiceError";
  }
}

/**
 * Base class for all server-side services
 * Provides Prisma access, error handling, and transaction support
 */
export abstract class BaseServerService {
  /**
   * Get Prisma client instance
   * Protected so subclasses can access it
   */
  protected get prisma() {
    return prisma;
  }

  /**
   * Execute a database operation with error handling
   */
  protected async execute<T>(
    operation: () => Promise<T>,
    errorMessage: string = "Database operation failed"
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, errorMessage);
      throw error; // Re-throw after handling
    }
  }

  /**
   * Execute a transaction with error handling
   */
  protected async transaction<T>(
    operations: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    }
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(operations, options);
    } catch (error) {
      this.handleError(error, "Transaction failed");
      throw error;
    }
  }

  /**
   * Handle errors consistently across all services
   */
  protected handleError(error: unknown, context: string): void {
    // Log error for debugging
    console.error(`[${this.constructor.name}] ${context}:`, error);

    // Transform Prisma errors to more user-friendly messages
    if (this.isPrismaError(error)) {
      this.transformPrismaError(error);
    }
  }

  /**
   * Check if error is a Prisma error
   */
  private isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      "meta" in error
    );
  }

  /**
   * Transform Prisma errors to ServerServiceError
   */
  private transformPrismaError(error: Prisma.PrismaClientKnownRequestError): void {
    switch (error.code) {
      case "P2002":
        throw new ServerServiceError(
          "A record with this value already exists",
          409,
          "UNIQUE_CONSTRAINT_VIOLATION",
          error
        );
      case "P2025":
        throw new ServerServiceError(
          "Record not found",
          404,
          "RECORD_NOT_FOUND",
          error
        );
      case "P2003":
        throw new ServerServiceError(
          "Invalid reference to related record",
          400,
          "FOREIGN_KEY_CONSTRAINT_VIOLATION",
          error
        );
      case "P2014":
        throw new ServerServiceError(
          "Invalid relation operation",
          400,
          "INVALID_RELATION",
          error
        );
      default:
        throw new ServerServiceError(
          `Database error: ${error.message}`,
          500,
          error.code,
          error
        );
    }
  }

  /**
   * Create a standardized error response
   */
  protected createErrorResponse(
    message: string,
    statusCode: number = 500,
    code?: string
  ): ServerServiceError {
    return new ServerServiceError(message, statusCode, code);
  }

  /**
   * Validate required fields
   */
  protected validateRequired<T extends object>(
    data: T,
    fields: (keyof T)[]
  ): void {
    const missing = fields.filter((field) => {
      const value = data[field];
      return value === undefined || value === null || value === "";
    });

    if (missing.length > 0) {
      throw new ServerServiceError(
        `Missing required fields: ${missing.join(", ")}`,
        400,
        "VALIDATION_ERROR"
      );
    }
  }

  /**
   * Check if a record exists
   */
  protected async recordExists(
    model: keyof typeof prisma,
    where: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const modelClient = prisma[model] as unknown as {
        findUnique: (args: { where: Record<string, unknown> }) => Promise<unknown>;
      };
      const record = await modelClient.findUnique({ where });
      return record !== null;
    } catch {
      return false;
    }
  }

  /**
   * Execute a query with caching
   * 
   * @param cacheKey - Unique cache key for this query
   * @param queryFn - Function that executes the database query
   * @param ttl - Time to live in seconds (default: 5 minutes)
   * @returns Query result (from cache or database)
   * 
   * @example
   * ```typescript
   * const doctors = await this.cachedQuery(
   *   'doctors:available',
   *   () => this.prisma.doctor.findMany({ where: { isVerified: true } }),
   *   CacheTTL.MEDIUM
   * );
   * ```
   */
  protected async cachedQuery<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM
  ): Promise<T> {
    return await cacheService.getOrSet(cacheKey, queryFn, ttl);
  }

  /**
   * Execute a query with Stale-While-Revalidate caching
   * 
   * @param cacheKey - Unique cache key
   * @param queryFn - Function that executes the database query
   * @param freshTTL - Time in seconds data is considered fresh (default: 60s)
   * @param staleTTL - Total time in seconds data is kept in cache (default: 1h)
   */
  protected async cachedQuerySWR<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    freshTTL: number = CacheTTL.SHORT,
    staleTTL: number = CacheTTL.HOUR
  ): Promise<T> {
    return await cacheService.getOrSetSWR(cacheKey, queryFn, freshTTL, staleTTL);
  }

  /**
   * Execute a findMany query with caching
   * Only caches if no complex filters are provided
   * 
   * @param cacheKey - Unique cache key
   * @param queryFn - Function that executes findMany
   * @param ttl - Time to live in seconds
   * @param skipCache - Whether to skip caching (e.g., for complex queries)
   * @returns Array of records
   */
  protected async cachedFindMany<T>(
    cacheKey: string,
    queryFn: () => Promise<T[]>,
    ttl: number = CacheTTL.MEDIUM,
    skipCache: boolean = false
  ): Promise<T[]> {
    if (skipCache) {
      return await queryFn();
    }
    return await this.cachedQuery(cacheKey, queryFn, ttl);
  }

  /**
   * Execute a count query with caching
   * 
   * @param cacheKey - Unique cache key
   * @param countFn - Function that executes count
   * @param ttl - Time to live in seconds
   * @returns Count result
   */
  protected async cachedCount(
    cacheKey: string,
    countFn: () => Promise<number>,
    ttl: number = CacheTTL.SHORT
  ): Promise<number> {
    return await this.cachedQuery(cacheKey, countFn, ttl);
  }

  /**
   * Invalidate cache for a specific key
   * 
   * @param cacheKey - Cache key to invalidate
   */
  protected async invalidateCache(cacheKey: string): Promise<void> {
    await cacheService.invalidate(cacheKey);
  }

  /**
   * Invalidate cache for all keys matching a pattern
   * 
   * @param pattern - Pattern to match (e.g., 'doctors:*')
   */
  protected async invalidateCachePattern(pattern: string): Promise<void> {
    await cacheService.invalidatePattern(pattern);
  }
}


