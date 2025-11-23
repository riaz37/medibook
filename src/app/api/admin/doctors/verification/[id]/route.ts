import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateVerificationStatusSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";

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

    // Middleware ensures user is admin for /api/admin/* routes
    const { getAuthContext } = await import("@/lib/server/auth-utils");
    const context = await getAuthContext(true); // Include DB user for reviewedBy field

    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!context.dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Ensure user is admin
    if (context.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
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
      return NextResponse.json(
        { error: "Rejection reason is required when rejecting" },
        { status: 400 }
      );
    }

    // Update verification (id is the verification ID)
    const verification = await prisma.doctorVerification.update({
      where: { id },
      data: {
        status: status as "APPROVED" | "REJECTED",
        reviewedAt: new Date(),
        reviewedBy: context.dbUser.id,
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
    console.error("Error updating verification:", error);
    return NextResponse.json(
      { error: "Failed to update verification" },
      { status: 500 }
    );
  }
}

