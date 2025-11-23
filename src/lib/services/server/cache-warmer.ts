import { cacheService, CacheKeys, CacheTTL } from './cache.service';
import { doctorsServerService } from './doctors.service';
import prisma from '@/lib/prisma';

/**
 * Cache Warmer Service
 * Pre-populates critical caches to eliminate cold start penalties
 */
export class CacheWarmer {
    private warmingStrategies: Map<string, () => Promise<void>>;

    constructor() {
        this.warmingStrategies = new Map();
        this.registerStrategies();
    }

    /**
     * Register all warming strategies
     */
    private registerStrategies() {
        this.warmingStrategies.set('availableDoctors', this.warmAvailableDoctors.bind(this));
        this.warmingStrategies.set('adminStats', this.warmAdminStats.bind(this));
        this.warmingStrategies.set('commissionSettings', this.warmCommissionSettings.bind(this));
        this.warmingStrategies.set('pendingVerifications', this.warmPendingVerifications.bind(this));
    }

    /**
     * Warm available doctors cache
     */
    private async warmAvailableDoctors(): Promise<void> {
        try {
            const doctors = await doctorsServerService.getAvailable();
            console.log(`✅ Warmed available doctors cache (${doctors.length} doctors)`);
        } catch (error) {
            console.error('❌ Failed to warm available doctors cache:', error);
        }
    }

    /**
     * Warm admin statistics cache
     */
    private async warmAdminStats(): Promise<void> {
        try {
            const [totalDoctors, verifiedDoctors, totalAppointments, completedAppointments] =
                await Promise.all([
                    prisma.doctor.count(),
                    prisma.doctor.count({ where: { isVerified: true } }),
                    prisma.appointment.count(),
                    prisma.appointment.count({ where: { status: 'COMPLETED' } }),
                ]);

            const stats = {
                totalDoctors,
                verifiedDoctors,
                totalAppointments,
                completedAppointments,
            };

            await cacheService.set(CacheKeys.adminStats(), stats, CacheTTL.SHORT);
            console.log('✅ Warmed admin stats cache');
        } catch (error) {
            console.error('❌ Failed to warm admin stats cache:', error);
        }
    }

    /**
     * Warm commission settings cache
     */
    private async warmCommissionSettings(): Promise<void> {
        try {
            const settings = await prisma.platformSettings.findFirst({
                select: { commissionPercentage: true },
            });

            if (settings) {
                await cacheService.set(
                    CacheKeys.commission(),
                    settings.commissionPercentage,
                    CacheTTL.VERY_LONG
                );
                console.log('✅ Warmed commission settings cache');
            }
        } catch (error) {
            console.error('❌ Failed to warm commission settings cache:', error);
        }
    }

    /**
     * Warm pending verifications cache
     */
    private async warmPendingVerifications(): Promise<void> {
        try {
            const count = await prisma.doctorVerification.count({
                where: { status: 'PENDING' },
            });

            await cacheService.set(CacheKeys.pendingVerifications(), count, CacheTTL.SHORT);
            console.log(`✅ Warmed pending verifications cache (${count} pending)`);
        } catch (error) {
            console.error('❌ Failed to warm pending verifications cache:', error);
        }
    }

    /**
     * Warm a specific cache by name
     */
    async warmCache(name: string): Promise<void> {
        const strategy = this.warmingStrategies.get(name);
        if (!strategy) {
            console.warn(`⚠️  Unknown cache warming strategy: ${name}`);
            return;
        }

        await strategy();
    }

    /**
     * Warm all registered caches
     */
    async warmAll(): Promise<void> {
        console.log('🔥 Starting cache warming...');
        const startTime = Date.now();

        const promises = Array.from(this.warmingStrategies.values()).map((strategy) =>
            strategy().catch((error) => {
                console.error('Cache warming error:', error);
            })
        );

        await Promise.all(promises);

        const duration = Date.now() - startTime;
        console.log(`✅ Cache warming complete in ${duration}ms`);
    }

    /**
     * Warm critical caches only (for faster startup)
     */
    async warmCritical(): Promise<void> {
        console.log('🔥 Warming critical caches...');
        const startTime = Date.now();

        await Promise.all([
            this.warmAvailableDoctors(),
            this.warmAdminStats(),
        ]);

        const duration = Date.now() - startTime;
        console.log(`✅ Critical caches warmed in ${duration}ms`);
    }

    /**
     * Get list of available warming strategies
     */
    getStrategies(): string[] {
        return Array.from(this.warmingStrategies.keys());
    }
}

// Export singleton instance
export const cacheWarmer = new CacheWarmer();

/**
 * Warm caches on module import (optional - can be disabled)
 * Only runs in production
 */
if (process.env.NODE_ENV === 'production' && process.env.WARM_CACHE_ON_STARTUP === 'true') {
    // Warm critical caches in background (non-blocking)
    cacheWarmer.warmCritical().catch((error) => {
        console.error('Failed to warm caches on startup:', error);
    });
}
