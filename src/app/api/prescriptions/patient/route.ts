import { NextRequest, NextResponse } from "next/server";
import { prescriptionsServerService, usersServerService } from "@/lib/services/server";
import { requireAnyRole } from "@/lib/server/rbac";
import { createNotFoundResponse, createServerErrorResponse } from "@/lib/utils/api-response";

/**
 * GET /api/prescriptions/patient - List patient's prescriptions
 */
export async function GET(request: NextRequest) {
  try {
    // Require patient or admin role
    const authResult = await requireAnyRole(["patient", "admin"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { context } = authResult;
    const { searchParams } = new URL(request.url);

    // Get patient ID from DB user
    const dbUser = await usersServerService.findUniqueByClerkId(context.userId);
    if (!dbUser) {
      return createNotFoundResponse("User");
    }

    // Query parameters
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get prescriptions using service
    const { prescriptions, total } = await prescriptionsServerService.getByPatient(dbUser.id, {
      status: status as any,
      limit,
      offset,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            speciality: true,
            imageUrl: true,
          },
        },
        appointment: {
          select: {
            id: true,
            date: true,
            time: true,
          },
        },
        items: {
          include: {
            medication: true,
            refills: {
              orderBy: { requestedAt: "desc" },
            },
          },
        },
      },
    });

    return NextResponse.json({
      prescriptions,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[GET /api/prescriptions/patient] Error:", error);
    return createServerErrorResponse("Failed to fetch prescriptions");
  }
}

