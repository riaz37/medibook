import { NextRequest, NextResponse } from "next/server";
import { prescriptionsServerService } from "@/lib/services/server";
import { requireAnyRole } from "@/lib/server/rbac";
import { createNotFoundResponse, createServerErrorResponse } from "@/lib/utils/api-response";

/**
 * GET /api/prescriptions/doctor - List doctor's prescriptions
 */
export async function GET(request: NextRequest) {
  try {
    // Require doctor or admin role
    const authResult = await requireAnyRole(["doctor", "admin"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { context } = authResult;
    const { searchParams } = new URL(request.url);

    // Get doctor ID
    const doctorId = context.doctorId;
    if (!doctorId) {
      return createNotFoundResponse("Doctor profile");
    }

    // Query parameters
    const status = searchParams.get("status");
    const patientId = searchParams.get("patientId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get prescriptions using service
    const { prescriptions, total } = await prescriptionsServerService.getByDoctor(doctorId, {
      status: status as any,
      patientId: patientId || undefined,
      limit,
      offset,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
              where: { status: "PENDING" },
              take: 1,
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
    console.error("[GET /api/prescriptions/doctor] Error:", error);
    return createServerErrorResponse("Failed to fetch prescriptions");
  }
}

