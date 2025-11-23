import { NextRequest, NextResponse } from "next/server";
import { commissionService } from "@/lib/services/commission.service";

// Cache for 30 minutes (commission rarely changes)
export const revalidate = 1800;

/**
 * GET /api/settings/commission
 * Get current platform commission percentage
 * Public endpoint (needed for commission preview)
 */
export async function GET(request: NextRequest) {
  try {
    const percentage = await commissionService.getCommissionPercentage();
    return NextResponse.json({ commissionPercentage: percentage }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error("Error getting commission percentage:", error);
    return NextResponse.json(
      { error: "Failed to get commission percentage" },
      { status: 500 }
    );
  }
}

