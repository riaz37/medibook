import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/server/auth-utils";

/**
 * GET /api/admin/doctors - Get all doctors (admin only, includes unverified)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctors = await prisma.doctor.findMany({
      include: {
        _count: { select: { appointments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const doctorsWithCount = doctors.map((doctor) => ({
      ...doctor,
      appointmentCount: doctor._count.appointments,
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

