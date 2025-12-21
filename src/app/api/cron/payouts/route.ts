import { NextRequest, NextResponse } from "next/server";
import { payoutService } from "@/lib/services/payout.service";

/**
 * POST /api/cron/payouts
 * Cron job to process pending doctor payouts
 * Should be called periodically (e.g., every hour) to release payouts after appointment time
 * 
 * Setup: Use a cron service (Vercel Cron, GitHub Actions, etc.) to call this endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization for cron endpoint
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get pending payouts that are ready to be processed
    const pendingPayouts = await payoutService.getPendingPayouts();

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each pending payout
    for (const payout of pendingPayouts) {
      try {
        await payoutService.createPayout(payout.id);
        results.processed++;
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`Payout ${payout.id}: ${errorMessage}`);
        console.error(`Failed to process payout ${payout.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} payouts, ${results.failed} failed`,
      results,
    });
  } catch (error) {
    console.error("Error in payout cron job:", error);
    return NextResponse.json(
      { error: "Failed to process payouts" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/payouts
 * Manual trigger for testing (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { requireRole } = await import("@/lib/server/rbac");
    const authResult = await requireRole("admin");
    
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    // Get pending payouts
    const pendingPayouts = await payoutService.getPendingPayouts();

    return NextResponse.json({
      pendingPayouts: pendingPayouts.length,
      payouts: pendingPayouts.map((p) => ({
        id: p.id,
        appointmentId: p.appointmentId,
        amount: p.doctorPayoutAmount,
        scheduledAt: p.payoutScheduledAt,
      })),
    });
  } catch (error) {
    console.error("Error getting pending payouts:", error);
    return NextResponse.json(
      { error: "Failed to get pending payouts" },
      { status: 500 }
    );
  }
}

