import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/rbac";
import { appointmentsServerService, usersServerService } from "@/lib/services/server";
import { createNotFoundResponse, createServerErrorResponse } from "@/lib/utils/api-response";

// GET /api/appointments/doctor - Get doctor's appointments
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    // Get DB user by ID
    const dbUser = await usersServerService.findUnique(context.userId);

    if (!dbUser) {
      return createNotFoundResponse("User");
    }

    const user = await usersServerService.findUniqueWithDoctorProfile(dbUser.id);

    if (!user || !(user as any)?.doctorProfile) {
      return createNotFoundResponse("Doctor profile");
    }

    const appointments = await appointmentsServerService.getByDoctor((user as any).doctorProfile.id, {
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("[GET /api/appointments/doctor] Error:", error);
    return createServerErrorResponse("Failed to fetch doctor appointments");
  }
}
