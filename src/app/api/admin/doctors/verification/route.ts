import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/doctors/verification - Get all pending verifications (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { requireRole } = await import("@/lib/server/rbac");
    const authResult = await requireRole("admin");
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const verifications = await prisma.doctorVerification.findMany({
      where: status
        ? {
          status: status as "PENDING" | "APPROVED" | "REJECTED",
        }
        : undefined,
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

