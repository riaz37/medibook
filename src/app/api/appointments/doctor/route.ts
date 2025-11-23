import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth-utils";
import { appointmentsServerService, usersServerService } from "@/lib/services/server";

// GET /api/appointments/doctor - Get doctor's appointments
export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext();
    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get DB user from Clerk user ID
    const dbUser = await usersServerService.findUniqueByClerkId(context.clerkUserId);

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = await usersServerService.findUniqueWithDoctorProfile(dbUser.id);

    if (!user || !(user as any)?.doctorProfile) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 }
      );
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
    console.error("Error fetching doctor appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctor appointments" },
      { status: 500 }
    );
  }
}

