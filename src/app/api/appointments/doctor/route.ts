import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";

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
    const user = await prisma.user.findUnique({
      where: { clerkId: context.clerkUserId },
      include: { doctorProfile: true },
    });

    if (!user || !user.doctorProfile) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 }
      );
    }

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: user.doctorProfile.id },
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
      orderBy: [{ date: "asc" }, { time: "asc" }],
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

