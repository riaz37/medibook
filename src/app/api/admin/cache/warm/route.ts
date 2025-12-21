import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/server/rbac";
import { cacheWarmer } from "@/lib/services/server/cache-warmer";

/**
 * POST /api/admin/cache/warm
 * Trigger cache warming
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireRole("admin");
        if ("response" in authResult) {
            return authResult.response;
        }
        
        const { context } = authResult;

        const body = await request.json();
        const { strategy } = body;

        if (strategy) {
            await cacheWarmer.warmCache(strategy);
            return NextResponse.json({ message: `Cache warming strategy '${strategy}' executed` });
        }

        // Warm all if no strategy specified
        await cacheWarmer.warmAll();
        return NextResponse.json({ message: "All cache warming strategies executed" });
    } catch (error) {
        console.error("Error warming cache:", error);
        return NextResponse.json(
            { error: "Failed to warm cache" },
            { status: 500 }
        );
    }
}
