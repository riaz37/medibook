import { NextRequest, NextResponse } from "next/server";
import { appointmentsServerService, usersServerService } from "@/lib/services/server";
import { requireAuth } from "@/lib/server/rbac";

// GET /api/appointments/stats - Get user appointment statistics
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

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

