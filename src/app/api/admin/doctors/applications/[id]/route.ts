import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/server/rbac";
import prisma from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { UserRole } from "@/generated/prisma/client";

/**
 * POST /api/admin/doctors/applications/[id]
 * 
 * Approve or reject a doctor application
 * Admin only
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin role
    const authResult = await requireRole("admin");
    if ("response" in authResult) {
      return authResult.response;
    }

    const { userId: adminUserId } = authResult;
    const applicationId = params.id;

    // Get application
    const application = await prisma.doctorApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.status !== "PENDING") {
      return NextResponse.json(
        { error: "Application has already been processed" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, rejectionReason } = body;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    if (action === "reject" && !rejectionReason?.trim()) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // Update application status
    const updatedApplication = await prisma.doctorApplication.update({
      where: { id: applicationId },
      data: {
        status: action === "approve" ? "APPROVED" : "REJECTED",
        reviewedAt: new Date(),
        reviewedBy: adminUserId,
        rejectionReason: action === "reject" ? rejectionReason : null,
      },
    });

    if (action === "approve") {
      // Update user role to DOCTOR
      const updatedUser = await prisma.user.update({
        where: { id: application.userId },
        data: {
          role: UserRole.DOCTOR,
        },
      });

      // Create doctor profile
      const doctor = await prisma.doctor.upsert({
        where: { userId: application.userId },
        update: {
          speciality: application.speciality,
          bio: application.bio || undefined,
        },
        create: {
          userId: application.userId,
          name: `${application.user.firstName || ""} ${application.user.lastName || ""}`.trim() || application.user.email,
          email: application.user.email,
          phone: application.user.phone || "",
          speciality: application.speciality,
          gender: "MALE", // Default, can be updated later
          imageUrl: "",
          isVerified: false, // Will need verification documents
        },
      });

      // Update Clerk metadata with role
      try {
        const client = await clerkClient();
        await client.users.updateUserMetadata(application.user.clerkId, {
          publicMetadata: {
            role: "doctor",
            doctorId: doctor.id,
          },
        });
      } catch (error) {
        console.error("Error updating Clerk metadata:", error);
        // Continue even if metadata update fails
      }

      // Log role change
      await prisma.roleChangeAudit.create({
        data: {
          userId: application.userId,
          oldRole: UserRole.PATIENT,
          newRole: UserRole.DOCTOR,
          changedBy: adminUserId,
          reason: "Doctor application approved",
        },
      });
    }

    return NextResponse.json({
      message: `Application ${action === "approve" ? "approved" : "rejected"} successfully`,
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Error processing application:", error);
    return NextResponse.json(
      { error: "Failed to process application" },
      { status: 500 }
    );
  }
}
