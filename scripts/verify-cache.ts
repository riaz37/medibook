import 'dotenv/config';
import { cacheService, CacheTTL } from '@/lib/services/server/cache.service';
import { cacheMetrics } from '@/lib/services/server/cache-metrics';

async function testCache() {
    console.log('🧪 Starting Cache Verification...');

    // 1. Test Basic Set/Get
    console.log('\n1. Testing Basic Set/Get');
    const testKey = 'test:key:1';
    const testValue = { foo: 'bar', timestamp: Date.now() };

    await cacheService.set(testKey, testValue, CacheTTL.SHORT);
    const retrieved = await cacheService.get(testKey);

    if (JSON.stringify(retrieved) === JSON.stringify(testValue)) {
        console.log('✅ Basic Set/Get passed');
    } else {
        console.error('❌ Basic Set/Get failed', { expected: testValue, got: retrieved });
    }

    // 2. Test getOrSet
    console.log('\n2. Testing getOrSet');
    const key2 = 'test:key:2';
    let fetchCount = 0;
    const fetchFn = async () => {
        fetchCount++;
        return 'fetched-data';
    };

    // First call - should fetch
    const val1 = await cacheService.getOrSet(key2, fetchFn, CacheTTL.SHORT);
    // Second call - should cache hit
    const val2 = await cacheService.getOrSet(key2, fetchFn, CacheTTL.SHORT);

    if (val1 === 'fetched-data' && val2 === 'fetched-data' && fetchCount === 1) {
        console.log('✅ getOrSet passed (fetched once, served twice)');
    } else {
        console.error('❌ getOrSet failed', { val1, val2, fetchCount });
    }

    // 3. Test Invalidation
    console.log('\n3. Testing Invalidation');
    await cacheService.invalidate(key2);
    const val3 = await cacheService.get(key2);
    if (val3 === null) {
        console.log('✅ Invalidation passed');
    } else {
        console.error('❌ Invalidation failed', val3);
    }

    // 4. Test SWR
    console.log('\n4. Testing SWR');
    const swrKey = 'test:swr:1';
    let swrFetchCount = 0;
    const swrFetchFn = async () => {
        swrFetchCount++;
        return `data-${swrFetchCount}`;
    };

    // Initial fetch
    const swr1 = await cacheService.getOrSetSWR(swrKey, swrFetchFn, 1, 10); // 1s fresh, 10s stale
    console.log('SWR 1:', swr1); // Should be data-1

    // Wait 2s (stale)
    await new Promise(r => setTimeout(r, 2000));

    // Second fetch - should return stale data-1 but trigger background fetch
    const swr2 = await cacheService.getOrSetSWR(swrKey, swrFetchFn, 1, 10);
    console.log('SWR 2 (Stale):', swr2); // Should be data-1

    // Wait for background fetch (simulated)
    await new Promise(r => setTimeout(r, 1000));

    // Third fetch - should return fresh data-2
    const swr3 = await cacheService.getOrSetSWR(swrKey, swrFetchFn, 1, 10);
    console.log('SWR 3 (Fresh):', swr3); // Should be data-2

    if (swr1 === 'data-1' && swr2 === 'data-1' && swr3 === 'data-2') {
        console.log('✅ SWR passed');
    } else {
        console.error('❌ SWR failed', { swr1, swr2, swr3 });
    }

    // 5. Metrics
    console.log('\n5. Testing Metrics');
    const stats = await cacheMetrics.getStats();
    console.log('Stats:', JSON.stringify(stats, null, 2));
    if (stats.hits > 0 && stats.misses > 0 && stats.sets > 0) {
        console.log('✅ Metrics passed');
    } else {
        console.warn('⚠️ Metrics might be empty or incorrect');
    }

    console.log('\n🎉 Verification Complete');
    process.exit(0);
}

testCache().catch(console.error);
