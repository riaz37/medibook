import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";

// GET /api/appointments/booked-slots - Get booked time slots for a doctor on a date
export async function GET(request: NextRequest) {
  try {
    // This endpoint is public (used for booking flow), but we can optionally verify auth
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: "Doctor ID and date are required" },
        { status: 400 }
      );
    }

    // Verify doctor exists and is verified
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { isVerified: true },
    });

    if (!doctor || !doctor.isVerified) {
      return NextResponse.json(
        { error: "Doctor not found or not verified" },
        { status: 404 }
      );
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        date: new Date(date),
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED], // Include PENDING as it blocks slots
        },
      },
      select: { time: true, duration: true },
    });

    const bookedSlots = appointments.map((appointment) => appointment.time);

    return NextResponse.json(bookedSlots);
  } catch (error) {
    console.error("Error fetching booked time slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch booked time slots" },
      { status: 500 }
    );
  }
}

