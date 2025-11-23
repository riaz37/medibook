import { NextRequest, NextResponse } from "next/server";
import { doctorsServerService } from "@/lib/services/server";

// Cache for 5 minutes
export const revalidate = 300;

// GET /api/doctors/available - Get available (active) doctors
export async function GET(request: NextRequest) {
  try {
    const doctors = await doctorsServerService.getAvailable();

    const doctorsWithCount = doctors.map((doctor: any) => ({
      ...doctor,
      appointmentCount: doctor._count?.appointments || 0,
    }));

    return NextResponse.json(doctorsWithCount, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error("Error fetching available doctors:", error);
    return NextResponse.json(
      { error: "Failed to fetch available doctors" },
      { status: 500 }
    );
  }
}

