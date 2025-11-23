import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth-utils";
import { cacheMetrics } from "@/lib/services/server/cache-metrics";
import { cacheService } from "@/lib/services/server/cache.service";

/**
 * GET /api/admin/cache/stats
 * Get cache performance statistics
 */
export async function GET(request: NextRequest) {
    try {
        const context = await getAuthContext();

        if (!context || context.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized - Admin access required" },
                { status: 403 }
            );
        }

        const stats = await cacheMetrics.getStats();
        const isRedisAvailable = cacheService.isAvailable();

        return NextResponse.json({
            ...stats,
            redisAvailable: isRedisAvailable,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error fetching cache stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch cache statistics" },
            { status: 500 }
        );
    }
}
