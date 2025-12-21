import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/server/rbac";
import type { DoctorApplicationData } from "@/lib/types/rbac";

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
      where: { clerkId: userId },
      include: {
        doctorApplication: true,
        doctorProfile: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is already a doctor
    if (dbUser.role === "DOCTOR" || dbUser.doctorProfile) {
      return NextResponse.json(
        { error: "You are already a doctor on the platform" },
        { status: 400 }
      );
    }

    // Check if user already has a pending application
    if (dbUser.doctorApplication) {
      if (dbUser.doctorApplication.status === "PENDING") {
        return NextResponse.json(
          { error: "You already have a pending application" },
          { status: 400 }
        );
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
      return NextResponse.json(
        { error: "Speciality is required" },
        { status: 400 }
      );
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

    // TODO: Send notification to admins about new application
    // This could be done via email, in-app notification, or webhook

    return NextResponse.json(
      {
        message: "Application submitted successfully",
        application: {
          id: application.id,
          status: application.status,
          submittedAt: application.submittedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting doctor application:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
