import { NextRequest, NextResponse } from "next/server";
import { appointmentsServerService, usersServerService } from "@/lib/services/server";

// GET /api/appointments/stats - Get user appointment statistics
export async function GET(request: NextRequest) {
  try {
    // Middleware ensures user is authenticated
    const { getAuthContext } = await import("@/lib/utils/auth-utils");
    const context = await getAuthContext();
    
    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Filter based on role
    let appointments;
    if (context.role === "patient") {
      // Get DB user ID for patient
      const dbUser = await usersServerService.findUniqueByClerkId(context.clerkUserId);
      if (!dbUser) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      appointments = await appointmentsServerService.getByUser(dbUser.id);
    } else if (context.role === "doctor" && context.doctorId) {
      appointments = await appointmentsServerService.getByDoctor(context.doctorId);
    } else {
      // Admin sees all
      appointments = await appointmentsServerService.findMany();
    }

    // Calculate stats
    const totalCount = appointments.length;
    const completedCount = appointments.filter(
      (apt: any) => apt.status === "COMPLETED"
    ).length;

    return NextResponse.json({
      totalAppointments: totalCount,
      completedAppointments: completedCount,
    });
  } catch (error) {
    console.error("Error fetching user appointment stats:", error);
    return NextResponse.json(
      { totalAppointments: 0, completedAppointments: 0 },
      { status: 200 }
    );
  }
}

