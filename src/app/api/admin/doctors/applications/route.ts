import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/server/rbac";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/doctors/applications
 * 
 * Get all doctor applications
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role
    const authResult = await requireRole("admin");
    if ("response" in authResult) {
      return authResult.response;
    }

    const applications = await prisma.doctorApplication.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return NextResponse.json({
      applications: applications.map((app) => ({
        id: app.id,
        userId: app.userId,
        speciality: app.speciality,
        licenseNumber: app.licenseNumber,
        yearsOfExperience: app.yearsOfExperience,
        bio: app.bio,
        status: app.status,
        submittedAt: app.submittedAt,
        reviewedAt: app.reviewedAt,
        reviewedBy: app.reviewedBy,
        rejectionReason: app.rejectionReason,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        user: app.user,
      })),
    });
  } catch (error) {
    console.error("Error fetching doctor applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
