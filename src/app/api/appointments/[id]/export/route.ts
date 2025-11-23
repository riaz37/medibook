import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAppointmentAccess } from "@/lib/server/auth-utils";
import { generateICS } from "@/lib/utils/ics-generator";

// GET /api/appointments/[id]/export - Export appointment as ICS calendar file
export async function GET(
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

    // Get appointment with related data
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        doctor: {
          select: {
            name: true,
            email: true,
            speciality: true,
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

    // Get appointment type if available
    let appointmentType = null;
    if (appointment.appointmentTypeId) {
      appointmentType = await prisma.doctorAppointmentType.findUnique({
        where: { id: appointment.appointmentTypeId },
        select: {
          name: true,
          description: true,
        },
      });
    }

    // Calculate start and end times
    const [hours, minutes] = appointment.time.split(":").map(Number);
    const startDate = new Date(appointment.date);
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + appointment.duration);

    // Generate ICS content
    const patientName = `${appointment.user.firstName || ""} ${appointment.user.lastName || ""}`.trim() || "Patient";
    const title = `${appointmentType?.name || appointment.reason || "Appointment"} with ${appointment.doctor.name}`;
    const description = [
      `Appointment with Dr. ${appointment.doctor.name}`,
      appointmentType?.description && `Type: ${appointmentType.description}`,
      appointment.reason && `Reason: ${appointment.reason}`,
      appointment.notes && `Notes: ${appointment.notes}`,
    ]
      .filter(Boolean)
      .join("\\n");

    const icsContent = generateICS({
      id: appointment.id,
      title,
      description,
      startDate,
      endDate,
      location: "Medical Center", // Could be made configurable
      doctorName: appointment.doctor.name,
      doctorEmail: appointment.doctor.email,
      patientName,
      patientEmail: appointment.user.email,
    });

    // Return as downloadable file
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="appointment-${appointment.id}.ics"`,
      },
    });
  } catch (error) {
    console.error("Error exporting appointment:", error);
    return NextResponse.json(
      { error: "Failed to export appointment" },
      { status: 500 }
    );
  }
}

