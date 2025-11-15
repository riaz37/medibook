import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/doctors/available - Get available (active) doctors
export async function GET(request: NextRequest) {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { 
        isVerified: true, // Only show verified doctors
      },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const doctorsWithCount = doctors.map((doctor) => ({
      ...doctor,
      appointmentCount: doctor._count.appointments,
    }));

    return NextResponse.json(doctorsWithCount);
  } catch (error) {
    console.error("Error fetching available doctors:", error);
    return NextResponse.json(
      { error: "Failed to fetch available doctors" },
      { status: 500 }
    );
  }
}

