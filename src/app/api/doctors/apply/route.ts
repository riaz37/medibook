import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/server/rbac";
import type { DoctorApplicationData } from "@/lib/types/rbac";
import { createErrorResponse, createNotFoundResponse, createServerErrorResponse, successResponse } from "@/lib/utils/api-response";

/**
 * POST /api/doctors/apply
 * 
 * Submit a doctor application
 * - User must be authenticated
 * - User must not already be a doctor
 * - Creates a DoctorApplication record with PENDING status
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }

    const { context } = authResult;
    const { userId } = context;

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        doctorApplication: true,
        doctorProfile: true,
      },
    });

    if (!dbUser || !dbUser.role) {
      return createNotFoundResponse("User");
    }

    // Check if user is already a doctor (has doctor or doctor_pending role)
    if (dbUser.role.name === "doctor" || dbUser.role.name === "doctor_pending") {
      return createErrorResponse("You are already a doctor on the platform", 400, undefined, "ALREADY_DOCTOR");
    }

    // Check if user already has a pending application
    if (dbUser.doctorApplication) {
      if (dbUser.doctorApplication.status === "PENDING") {
        return createErrorResponse("You already have a pending application", 400, undefined, "PENDING_APPLICATION_EXISTS");
      }
      
      // If previous application was rejected, allow new application
      if (dbUser.doctorApplication.status === "REJECTED") {
        // Delete old application to allow new one
        await prisma.doctorApplication.delete({
          where: { userId: dbUser.id },
        });
      }
    }

    // Parse request body
    const body: DoctorApplicationData = await request.json();

    // Validate required fields
    if (!body.speciality || body.speciality.trim() === "") {
      return createErrorResponse("Speciality is required", 400, [{ field: "speciality", message: "Speciality is required" }], "VALIDATION_ERROR");
    }

    // Validate required documents
    if (!body.licenseUrl || body.licenseUrl.trim() === "") {
      return createErrorResponse("Medical license document is required", 400, [{ field: "licenseUrl", message: "Medical license document is required" }], "VALIDATION_ERROR");
    }

    // Create doctor application
    const application = await prisma.doctorApplication.create({
      data: {
        userId: dbUser.id,
        speciality: body.speciality.trim(),
        licenseNumber: body.licenseNumber?.trim() || null,
        yearsOfExperience: body.yearsOfExperience || null,
        bio: body.bio?.trim() || null,
        status: "PENDING",
      },
    });

    // Create doctor profile if it doesn't exist
    let doctor = await prisma.doctor.findUnique({
      where: { userId: dbUser.id },
    });

    if (!doctor) {
      doctor = await prisma.doctor.create({
        data: {
          userId: dbUser.id,
          name: `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim() || dbUser.email,
          email: dbUser.email,
          phone: dbUser.phone || "",
          speciality: body.speciality.trim(),
          bio: body.bio?.trim() || null,
          gender: "MALE", // Default, can be updated later
          imageUrl: "",
          isVerified: false,
          yearsOfExperience: body.yearsOfExperience || null,
        },
      });
    }

    // Create verification with documents
    await prisma.doctorVerification.upsert({
      where: { doctorId: doctor.id },
      create: {
        doctorId: doctor.id,
        licenseUrl: body.licenseUrl?.trim() || null,
        certificateUrl: body.certificateUrl?.trim() || null,
        idDocumentUrl: body.idDocumentUrl?.trim() || null,
        status: "PENDING",
        submittedAt: new Date(),
      },
      update: {
        licenseUrl: body.licenseUrl?.trim() || null,
        certificateUrl: body.certificateUrl?.trim() || null,
        idDocumentUrl: body.idDocumentUrl?.trim() || null,
        status: "PENDING",
        submittedAt: new Date(),
        rejectionReason: null, // Clear previous rejection reason
      },
    });

    // TODO: Send notification to admins about new application
    // This could be done via email, in-app notification, or webhook

    return successResponse(
      {
        id: application.id,
        status: application.status,
        submittedAt: application.submittedAt,
      },
      "Application submitted successfully",
      201
    );
  } catch (error) {
    console.error("Error submitting doctor application:", error);
    return createServerErrorResponse("Failed to submit application");
  }
}
