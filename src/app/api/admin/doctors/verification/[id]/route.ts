import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateVerificationStatusSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requireRole } from "@/lib/server/rbac";
import { createNotFoundResponse, createErrorResponse, createServerErrorResponse } from "@/lib/utils/api-response";

/**
 * PUT /api/admin/doctors/verification/[id] - Approve or reject verification (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    const authResult = await requireRole("admin");
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    // Get DB user for reviewedBy field (context.userId is already the DB user ID)
    const dbUser = await prisma.user.findUnique({
      where: { id: context.userId },
      select: { id: true },
    });

    if (!dbUser) {
      return createNotFoundResponse("User");
    }

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(updateVerificationStatusSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { status, rejectionReason } = validation.data;

    // Additional validation: rejection reason required when rejecting
    if (status === "REJECTED" && !rejectionReason) {
      return createErrorResponse("Rejection reason is required when rejecting", 400, undefined, "MISSING_REJECTION_REASON");
    }

    // Update verification (id is the verification ID)
    const verification = await prisma.doctorVerification.update({
      where: { id },
      data: {
        status: status as "APPROVED" | "REJECTED",
        reviewedAt: new Date(),
        reviewedBy: dbUser.id,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
      },
      include: {
        doctor: true,
      },
    });

    // If approved, update doctor's verification status
    if (status === "APPROVED") {
      await prisma.doctor.update({
        where: { id: verification.doctorId },
        data: { isVerified: true },
      });
    } else {
      // If rejected, set doctor as unverified
      await prisma.doctor.update({
        where: { id: verification.doctorId },
        data: { isVerified: false },
      });
    }

    return NextResponse.json(verification);
  } catch (error) {
    console.error("[PUT /api/admin/doctors/verification/[id]] Error:", error);
    return createServerErrorResponse("Failed to update verification");
  }
}

