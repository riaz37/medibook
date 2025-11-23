import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth-utils";
import { cacheService } from "@/lib/services/server/cache.service";
import { cacheMetrics } from "@/lib/services/server/cache-metrics";

/**
 * POST /api/admin/cache/clear
 * Clear application cache
 */
export async function POST(request: NextRequest) {
    try {
        const context = await getAuthContext();

        if (!context || context.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized - Admin access required" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { key, pattern, all } = body;

        if (all) {
            await cacheService.invalidateAll();
            cacheMetrics.reset(); // Reset metrics when clearing all
            return NextResponse.json({ message: "All cache cleared successfully" });
        }

        if (pattern) {
            await cacheService.invalidatePattern(pattern);
            return NextResponse.json({ message: `Cache pattern '${pattern}' cleared successfully` });
        }

        if (key) {
            await cacheService.invalidate(key);
            return NextResponse.json({ message: `Cache key '${key}' cleared successfully` });
        }

        return NextResponse.json(
            { error: "Invalid request. Provide 'key', 'pattern', or 'all'" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error clearing cache:", error);
        return NextResponse.json(
            { error: "Failed to clear cache" },
            { status: 500 }
        );
    }
}
