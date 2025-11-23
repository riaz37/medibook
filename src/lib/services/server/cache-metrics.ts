import { cacheService } from './cache.service';

export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    invalidations: number;
    revalidations: number;
    errors: number;
    latency: {
        avg: number;
        p95: number;
        p99: number;
    };
    memory: {
        used: number;
        peak: number;
    };
    keys: number;
}

/**
 * Cache Metrics Service
 * Tracks cache performance and usage statistics
 */
export class CacheMetrics {
    private hits = 0;
    private misses = 0;
    private sets = 0;
    private invalidations = 0;
    private errors = 0;
    private latencies: number[] = [];
    private readonly MAX_LATENCY_SAMPLES = 1000;

    private revalidations = 0;

    /**
     * Record a cache hit
     */
    recordHit(latencyMs: number) {
        this.hits++;
        this.recordLatency(latencyMs);
    }

    /**
     * Record a cache miss
     */
    recordMiss(latencyMs: number) {
        this.misses++;
        this.recordLatency(latencyMs);
    }

    /**
     * Record a cache set operation
     */
    recordSet() {
        this.sets++;
    }

    /**
     * Record a cache invalidation
     */
    recordInvalidation() {
        this.invalidations++;
    }

    /**
     * Record a background revalidation
     */
    recordRevalidation() {
        this.revalidations++;
    }

    /**
     * Record a cache error
     */
    recordError() {
        this.errors++;
    }

    /**
     * Record operation latency
     */
    private recordLatency(ms: number) {
        this.latencies.push(ms);
        if (this.latencies.length > this.MAX_LATENCY_SAMPLES) {
            this.latencies.shift();
        }
    }

    /**
     * Get current statistics
     */
    async getStats(): Promise<CacheStats> {
        // Calculate latency percentiles
        const sortedLatencies = [...this.latencies].sort((a, b) => a - b);
        const avg = sortedLatencies.length
            ? sortedLatencies.reduce((a, b) => a + b, 0) / sortedLatencies.length
            : 0;
        const p95 = sortedLatencies.length
            ? sortedLatencies[Math.floor(sortedLatencies.length * 0.95)]
            : 0;
        const p99 = sortedLatencies.length
            ? sortedLatencies[Math.floor(sortedLatencies.length * 0.99)]
            : 0;

        // Get Redis stats if available
        let memory = { used: 0, peak: 0 };
        let keys = 0;

        try {
            if (cacheService.isAvailable()) {
                // This is a simplified check. In a real implementation, 
                // we would query Redis INFO command.
                // For now, we'll just return placeholders or basic info if possible.
                // Since we don't have direct access to the Redis client here easily without exposing it,
                // we might skip deep Redis stats for this iteration or expose a method in CacheService.
            }
        } catch (error) {
            // Ignore errors fetching redis stats
        }

        return {
            hits: this.hits,
            misses: this.misses,
            sets: this.sets,
            invalidations: this.invalidations,
            revalidations: this.revalidations,
            errors: this.errors,
            latency: {
                avg: Math.round(avg * 100) / 100,
                p95: Math.round(p95 * 100) / 100,
                p99: Math.round(p99 * 100) / 100,
            },
            memory,
            keys,
        };
    }

    /**
     * Reset statistics
     */
    reset() {
        this.hits = 0;
        this.misses = 0;
        this.sets = 0;
        this.invalidations = 0;
        this.revalidations = 0;
        this.errors = 0;
        this.latencies = [];
    }
}

// Export singleton instance
export const cacheMetrics = new CacheMetrics();
