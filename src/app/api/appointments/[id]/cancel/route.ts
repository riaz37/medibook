import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppointmentAccess } from "@/lib/server/auth-utils";
import { z } from "zod";

const cancelSchema = z.object({
  reason: z.string().optional(),
});

// POST /api/appointments/[id]/cancel - Cancel an appointment
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
    const validation = cancelSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { reason } = validation.data;

    // Get the appointment to check if it can be cancelled
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

    // Check if appointment can be cancelled
    if (appointment.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot cancel a completed appointment" },
        { status: 400 }
      );
    }

    if (appointment.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Appointment is already cancelled" },
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
          error: `Cannot cancel appointment. Please cancel at least ${minBookingHours} hours before the appointment time. Contact support for urgent cancellations.` 
        },
        { status: 400 }
      );
    }

    // Cancel the appointment
    const cancelledAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: "CANCELLED",
        notes: reason ? `Cancellation reason: ${reason}` : appointment.notes,
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
      ...cancelledAppointment,
      patientName: `${cancelledAppointment.user.firstName || ""} ${cancelledAppointment.user.lastName || ""}`.trim(),
      patientEmail: cancelledAppointment.user.email,
      doctorName: cancelledAppointment.doctor.name,
      doctorImageUrl: cancelledAppointment.doctor.imageUrl || "",
      date: cancelledAppointment.date.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}

