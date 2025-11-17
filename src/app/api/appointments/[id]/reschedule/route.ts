import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppointmentAccess } from "@/lib/server/auth-utils";
import { z } from "zod";

const rescheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM format (24-hour)"),
});

// POST /api/appointments/[id]/reschedule - Reschedule an appointment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check appointment access (handles authorization)
    const accessResult = await requireAppointmentAccess(id);
    if ("response" in accessResult) {
      return accessResult.response;
    }

    const body = await request.json();
    const validation = rescheduleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { date, time } = validation.data;

    // Get the appointment to check if it can be rescheduled
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            availability: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check if appointment can be rescheduled (not completed or cancelled)
    if (appointment.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot reschedule a completed appointment" },
        { status: 400 }
      );
    }

    if (appointment.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot reschedule a cancelled appointment" },
        { status: 400 }
      );
    }

    // Check cancellation window (minimum hours before appointment)
    const appointmentDateTime = new Date(`${appointment.date.toISOString().split("T")[0]}T${appointment.time}`);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    const minBookingHours = appointment.doctor.availability?.minBookingHours || 24;
    if (hoursUntilAppointment < minBookingHours) {
      return NextResponse.json(
        { 
          error: `Cannot reschedule appointment. Please reschedule at least ${minBookingHours} hours before the appointment time.` 
        },
        { status: 400 }
      );
    }

    // Check if new time slot is available
    const newDate = new Date(date);
    const bookedSlots = await prisma.appointment.findMany({
      where: {
        doctorId: appointment.doctorId,
        date: newDate,
        time,
        status: {
          not: "CANCELLED",
        },
        id: {
          not: id, // Exclude current appointment
        },
      },
    });

    if (bookedSlots.length > 0) {
      return NextResponse.json(
        { error: "This time slot is already booked. Please choose another time." },
        { status: 400 }
      );
    }

    // Reschedule the appointment
    const rescheduledAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        date: newDate,
        time,
        status: "PENDING", // Reset to pending for doctor confirmation
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        doctor: { select: { name: true, imageUrl: true } },
      },
    });

    return NextResponse.json({
      ...rescheduledAppointment,
      patientName: `${rescheduledAppointment.user.firstName || ""} ${rescheduledAppointment.user.lastName || ""}`.trim(),
      patientEmail: rescheduledAppointment.user.email,
      doctorName: rescheduledAppointment.doctor.name,
      doctorImageUrl: rescheduledAppointment.doctor.imageUrl || "",
      date: rescheduledAppointment.date.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    return NextResponse.json(
      { error: "Failed to reschedule appointment" },
      { status: 500 }
    );
  }
}

