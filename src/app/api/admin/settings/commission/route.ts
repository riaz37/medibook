import { NextRequest, NextResponse } from "next/server";
import { commissionService } from "@/lib/services/commission.service";
import { requireRole } from "@/lib/server/rbac";

/**
 * GET /api/admin/settings/commission
 * Get current commission percentage (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole("admin");
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    const settings = await commissionService.getPlatformSettings();
    if (!settings) {
      return NextResponse.json(
        { error: "Commission settings not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      commissionPercentage: Number(settings.commissionPercentage),
      minCommission: settings.minCommission ? Number(settings.minCommission) : null,
      maxCommission: settings.maxCommission ? Number(settings.maxCommission) : null,
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy,
    });
  } catch (error) {
    console.error("Error getting commission settings:", error);
    return NextResponse.json(
      { error: "Failed to get commission settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/commission
 * Update commission percentage (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireRole("admin");
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    const body = await request.json();
    const { commissionPercentage } = body;

    if (typeof commissionPercentage !== "number") {
      return NextResponse.json(
        { error: "commissionPercentage must be a number" },
        { status: 400 }
      );
    }

    if (commissionPercentage < 1 || commissionPercentage > 10) {
      return NextResponse.json(
        { error: "Commission percentage must be between 1% and 10%" },
        { status: 400 }
      );
    }

    await commissionService.updateCommissionPercentage(
      commissionPercentage,
      context.userId
    );

    return NextResponse.json({
      success: true,
      message: "Commission percentage updated successfully",
      commissionPercentage,
    });
  } catch (error) {
    console.error("Error updating commission percentage:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update commission percentage";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

