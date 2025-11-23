#!/usr/bin/env tsx

/**
 * Cache Warming Script
 * Run this script to pre-populate caches after deployment
 * 
 * Usage:
 *   npm run warm-cache
 *   npm run warm-cache:critical (faster, only critical caches)
 */

import { cacheWarmer } from '../src/lib/services/server/cache-warmer';

async function main() {
    const args = process.argv.slice(2);
    const criticalOnly = args.includes('--critical');

    try {
        if (criticalOnly) {
            await cacheWarmer.warmCritical();
        } else {
            await cacheWarmer.warmAll();
        }

        console.log('✅ Cache warming script completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Cache warming script failed:', error);
        process.exit(1);
    }
}

main();
