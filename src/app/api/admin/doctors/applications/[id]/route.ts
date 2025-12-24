import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/server/rbac";
import prisma from "@/lib/prisma";
import { emailService } from "@/lib/services/email.service";
import { createErrorResponse, createNotFoundResponse, createServerErrorResponse } from "@/lib/utils/api-response";

/**
 * POST /api/admin/doctors/applications/[id]
 * 
 * Approve or reject a doctor application
 * Admin only
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin role
    const authResult = await requireRole("admin");
    if ("response" in authResult) {
      return authResult.response;
    }

    const { context } = authResult;
    const adminUserId = context.userId;
    const { id: applicationId } = await params;

    // Get application
    const application = await prisma.doctorApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          include: { role: true },
        },
      },
    });

    if (!application) {
      return createNotFoundResponse("Application");
    }

    if (application.status !== "PENDING") {
      return createErrorResponse("Application has already been processed", 400, undefined, "ALREADY_PROCESSED");
    }

    const body = await request.json();
    const { action, rejectionReason } = body;

    if (action !== "approve" && action !== "reject") {
      return createErrorResponse("Invalid action. Must be 'approve' or 'reject'", 400, undefined, "INVALID_ACTION");
    }

    if (action === "reject" && !rejectionReason?.trim()) {
      return createErrorResponse("Rejection reason is required", 400, [{ field: "rejectionReason", message: "Rejection reason is required" }], "VALIDATION_ERROR");
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
      // Update doctor profile
      await prisma.doctor.updateMany({
        where: { userId: application.userId },
        data: {
          speciality: application.speciality,
          bio: application.bio || undefined,
          isVerified: true, // Mark as verified
        },
      });
      
      // If doctor profile doesn't exist (edge case), create it
      const existingDoctor = await prisma.doctor.findUnique({
        where: { userId: application.userId },
      });
      
      if (!existingDoctor) {
        await prisma.doctor.create({
          data: {
            userId: application.userId,
            name: `${application.user.firstName || ""} ${application.user.lastName || ""}`.trim() || application.user.email,
            email: application.user.email,
            phone: application.user.phone || "",
            speciality: application.speciality,
            gender: "MALE", // Default, can be updated later
            imageUrl: "",
            isVerified: true,
          },
        });
      }

      // Change user role from "doctor_pending" to "doctor"
      const doctorRole = await prisma.role.findUnique({
        where: { name: "doctor" },
      });

      if (doctorRole) {
        await prisma.user.update({
          where: { id: application.userId },
          data: {
            roleId: doctorRole.id,
          },
        });
      }

      // Send approval email
      try {
        const doctorFullName = `${application.user.firstName || ""} ${application.user.lastName || ""}`.trim() || application.user.email;
        await emailService.sendDoctorApplicationApproval(
          application.user.email,
          doctorFullName,
          application.speciality || undefined
        );
        console.log("Approval email sent successfully to:", application.user.email);
      } catch (emailError) {
        // Log error but don't fail the approval - email can be retried later
        console.error("Failed to send approval email:", emailError);
      }
    } else {
      // Send rejection email
      try {
        const doctorFullName = `${application.user.firstName || ""} ${application.user.lastName || ""}`.trim() || application.user.email;
        await emailService.sendDoctorApplicationRejection(
          application.user.email,
          doctorFullName,
          rejectionReason || undefined
        );
        console.log("Rejection email sent successfully to:", application.user.email);
      } catch (emailError) {
        // Log error but don't fail the rejection - email can be retried later
        console.error("Failed to send rejection email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Application ${action === "approve" ? "approved" : "rejected"} successfully`,
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Error processing application:", error);
    return createServerErrorResponse("Failed to process application");
  }
}
