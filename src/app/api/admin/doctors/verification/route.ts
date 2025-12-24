import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/server/rbac";
import { createServerErrorResponse, createUnauthorizedResponse } from "@/lib/utils/api-response";

/**
 * GET /api/admin/doctors/verification - Get all pending verifications (admin only)
 */
export async function GET(request: NextRequest) {
  try {
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
    console.error("[GET /api/admin/doctors/verification] Error:", error);
    return createServerErrorResponse("Failed to fetch verifications");
  }
}

