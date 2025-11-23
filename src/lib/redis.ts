import Redis from 'ioredis';

const getRedisUrl = () => {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }

    // For development, use local Redis if available
    if (process.env.NODE_ENV === 'development') {
        return 'redis://localhost:6379';
    }

    throw new Error('REDIS_URL environment variable is not defined');
};

// Create Redis client with retry strategy
const createRedisClient = () => {
    try {
        const client = new Redis(getRedisUrl(), {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            // Gracefully handle connection errors
            lazyConnect: true,
        });

        client.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        client.on('connect', () => {
            console.log('✅ Redis connected successfully');
        });

        return client;
    } catch (error) {
        console.error('Failed to create Redis client:', error);
        // Return null if Redis is not available (graceful degradation)
        return null;
    }
};

export const redis = createRedisClient();

/**
 * Get cached data
 */
export const cacheGet = async <T>(key: string): Promise<T | null> => {
    if (!redis) return null;

    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Cache get error for key ${key}:`, error);
        return null;
    }
};

/**
 * Set cached data with TTL
 */
export const cacheSet = async <T>(
    key: string,
    value: T,
    ttl: number = 300 // 5 minutes default
): Promise<void> => {
    if (!redis) return;

    try {
        await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
        console.error(`Cache set error for key ${key}:`, error);
    }
};

/**
 * Delete cached data
 */
export const cacheDelete = async (key: string): Promise<void> => {
    if (!redis) return;

    try {
        await redis.del(key);
    } catch (error) {
        console.error(`Cache delete error for key ${key}:`, error);
    }
};

/**
 * Delete cached data by pattern
 */
export const cacheDeletePattern = async (pattern: string): Promise<void> => {
    if (!redis) return;

    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (error) {
        console.error(`Cache delete pattern error for ${pattern}:`, error);
    }
};

/**
 * Check if Redis is available
 */
export const isRedisAvailable = (): boolean => {
    return redis !== null && redis.status === 'ready';
};
