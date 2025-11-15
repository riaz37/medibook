import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/doctors/verification - Get all pending verifications (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Middleware ensures user is admin for /api/admin/* routes
    const { getAuthContext } = await import("@/lib/server/auth-utils");
    const context = await getAuthContext();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";

    const verifications = await prisma.doctorVerification.findMany({
      where: {
        status: status as "PENDING" | "APPROVED" | "REJECTED",
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            speciality: true,
            imageUrl: true,
            createdAt: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(verifications);
  } catch (error) {
    console.error("Error fetching verifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch verifications" },
      { status: 500 }
    );
  }
}

