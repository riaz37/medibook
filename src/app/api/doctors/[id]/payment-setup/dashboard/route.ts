import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createExpressDashboardLink } from "@/lib/stripe-connect";
import { requireAuth } from "@/lib/server/rbac";

/**
 * GET /api/doctors/[id]/payment-setup/dashboard
 * Get Express Dashboard login link for doctor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    // Check authorization
    if (context.role === "doctor" && context.doctorId !== id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get payment account
    const account = await prisma.doctorPaymentAccount.findUnique({
      where: { doctorId: id },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Payment account not found" },
        { status: 404 }
      );
    }

    // Create Express Dashboard login link
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/doctor/settings/payments`;
    const loginLink = await createExpressDashboardLink(account.stripeAccountId, returnUrl);

    return NextResponse.json({
      dashboardUrl: loginLink.url,
    });
  } catch (error) {
    console.error("Error getting Express Dashboard link:", error);
    return NextResponse.json(
      { error: "Failed to get Express Dashboard link" },
      { status: 500 }
    );
  }
}

