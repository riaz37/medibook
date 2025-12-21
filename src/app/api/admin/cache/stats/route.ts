import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/server/rbac";
import { cacheMetrics } from "@/lib/services/server/cache-metrics";
import { cacheService } from "@/lib/services/server/cache.service";

/**
 * GET /api/admin/cache/stats
 * Get cache performance statistics
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireRole("admin");
        if ("response" in authResult) {
            return authResult.response;
        }
        
        const { context } = authResult;

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
