import { redis, cacheGet, cacheSet, cacheDelete, cacheDeletePattern } from '@/lib/redis';

import { cacheMetrics } from './cache-metrics';

/**
 * Cache Service
 * Provides caching functionality with automatic fallback if Redis is unavailable
 */
export class CacheService {
    private prefix: string;

    constructor(prefix: string = 'medibook') {
        this.prefix = prefix;
    }

    /**
     * Generate cache key with prefix
     */
    generateKey(...parts: (string | number)[]): string {
        return `${this.prefix}:${parts.join(':')}`;
    }

    /**
     * Get or set pattern - fetch from cache or execute function and cache result
     */
    async getOrSet<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttl: number = 300
    ): Promise<T> {
        const start = performance.now();
        try {
            // Try to get from cache
            const cached = await cacheGet<T>(key);
            if (cached !== null) {
                cacheMetrics.recordHit(performance.now() - start);
                return cached;
            }

            cacheMetrics.recordMiss(performance.now() - start);

            // Cache miss - fetch data
            const data = await fetchFn();

            // Cache the result
            await cacheSet(key, data, ttl);
            cacheMetrics.recordSet();

            return data;
        } catch (error) {
            cacheMetrics.recordError();
            throw error;
        }
    }

    /**
     * Get or set with Stale-While-Revalidate pattern
     * Returns stale data immediately if available, then updates cache in background
     */
    async getOrSetSWR<T>(
        key: string,
        fetchFn: () => Promise<T>,
        freshTTL: number = 60,
        staleTTL: number = 3600
    ): Promise<T> {
        const start = performance.now();
        try {
            // Try to get from cache
            // We expect the cached value to be wrapped: { value: T, timestamp: number }
            const cachedWrapper = await cacheGet<{ value: T; timestamp: number }>(key);

            // Check if it's a valid wrapper
            if (cachedWrapper && typeof cachedWrapper === 'object' && 'value' in cachedWrapper && 'timestamp' in cachedWrapper) {
                const age = (Date.now() - cachedWrapper.timestamp) / 1000;

                if (age < freshTTL) {
                    // Fresh
                    cacheMetrics.recordHit(performance.now() - start);
                    return cachedWrapper.value;
                }

                // Stale - return immediately but revalidate in background
                cacheMetrics.recordHit(performance.now() - start);

                // Trigger background revalidation (fire and forget)
                this.revalidateInBackground(key, fetchFn, staleTTL).catch(console.error);

                return cachedWrapper.value;
            }

            cacheMetrics.recordMiss(performance.now() - start);

            // Cache miss (or invalid format) - fetch data
            const data = await fetchFn();

            // Cache the result with timestamp
            await cacheSet(key, { value: data, timestamp: Date.now() }, staleTTL);
            cacheMetrics.recordSet();

            return data;
        } catch (error) {
            cacheMetrics.recordError();
            // Fallback to fetch if cache fails
            return await fetchFn();
        }
    }

    /**
     * Revalidate cache in background
     */
    private async revalidateInBackground<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttl: number
    ) {
        try {
            cacheMetrics.recordRevalidation();
            const data = await fetchFn();
            await cacheSet(key, { value: data, timestamp: Date.now() }, ttl);
            cacheMetrics.recordSet();
        } catch (error) {
            console.error(`Background revalidation failed for ${key}:`, error);
            cacheMetrics.recordError();
        }
    }

    /**
     * Get data from cache
     */
    async get<T>(key: string): Promise<T | null> {
        const start = performance.now();
        try {
            const data = await cacheGet<T>(key);
            if (data !== null) {
                cacheMetrics.recordHit(performance.now() - start);
            } else {
                cacheMetrics.recordMiss(performance.now() - start);
            }
            return data;
        } catch (error) {
            cacheMetrics.recordError();
            return null;
        }
    }

    /**
     * Set data in cache
     */
    async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
        try {
            await cacheSet(key, value, ttl);
            cacheMetrics.recordSet();
        } catch (error) {
            cacheMetrics.recordError();
        }
    }

    /**
     * Delete specific key from cache
     */
    async invalidate(key: string): Promise<void> {
        try {
            await cacheDelete(key);
            cacheMetrics.recordInvalidation();
        } catch (error) {
            cacheMetrics.recordError();
        }
    }

    /**
     * Delete all keys matching pattern
     */
    async invalidatePattern(pattern: string): Promise<void> {
        try {
            await cacheDeletePattern(pattern);
            cacheMetrics.recordInvalidation();
        } catch (error) {
            cacheMetrics.recordError();
        }
    }

    /**
     * Invalidate all cache entries with this service's prefix
     */
    async invalidateAll(): Promise<void> {
        return this.invalidatePattern(`${this.prefix}:*`);
    }

    /**
     * Check if Redis is available
     */
    isAvailable(): boolean {
        return redis !== null && redis.status === 'ready';
    }
}

// Export singleton instance
export const cacheService = new CacheService('medibook');

/**
 * Cache key patterns for different entities
 */
export const CacheKeys = {
    // Doctors
    doctor: (id: string) => `medibook:doctor:${id}`,
    doctorsList: (filters?: string) => `medibook:doctors:list${filters ? `:${filters}` : ''}`,
    availableDoctors: () => 'medibook:doctors:available',

    // Appointments
    appointment: (id: string) => `medibook:appointment:${id}`,
    doctorAppointments: (doctorId: string, filters?: string) =>
        `medibook:appointments:doctor:${doctorId}${filters ? `:${filters}` : ''}`,
    patientAppointments: (userId: string, filters?: string) =>
        `medibook:appointments:patient:${userId}${filters ? `:${filters}` : ''}`,

    // Medications
    medication: (id: string) => `medibook:medication:${id}`,
    medicationSearch: (query: string) => `medibook:medications:search:${query}`,

    // Settings
    commission: () => 'medibook:settings:commission',

    // Admin Stats
    adminStats: () => 'medibook:admin:stats',
    pendingVerifications: () => 'medibook:admin:verifications:pending',
} as const;

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
    SHORT: 60,           // 1 minute
    MEDIUM: 300,         // 5 minutes
    LONG: 600,           // 10 minutes
    VERY_LONG: 1800,     // 30 minutes
    HOUR: 3600,          // 1 hour
    DAY: 86400,          // 24 hours
} as const;
