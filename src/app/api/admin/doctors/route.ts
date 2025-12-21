import { NextRequest, NextResponse } from "next/server";
import { doctorsServerService } from "@/lib/services/server";
import { requireRole } from "@/lib/server/rbac";

/**
 * GET /api/admin/doctors - Get all doctors (admin only, includes unverified)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole("admin");
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    const doctors = await doctorsServerService.getAllForAdmin();

    const doctorsWithCount = doctors.map((doctor: any) => ({
      ...doctor,
      appointmentCount: doctor._count?.appointments || 0,
    }));

    return NextResponse.json(doctorsWithCount);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}

