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
      appointments = await appointmentsServerService.getByUser(context.userId);
    } else if ((context.role === "doctor" || context.role === "doctor_pending") && context.doctorId) {
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
