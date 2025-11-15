import { NextRequest, NextResponse } from "next/server";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { updateAppointmentStatusSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requireAppointmentAccess } from "@/lib/server/auth-utils";

// GET /api/appointments/[id] - Get appointment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    // Check appointment access (handles authorization)
    const accessResult = await requireAppointmentAccess(id);
    if ("response" in accessResult) {
      return accessResult.response;
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            speciality: true,
            imageUrl: true,
            bio: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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

    // Fetch appointment type separately if appointmentTypeId exists
    let appointmentType = null;
    if (appointment.appointmentTypeId) {
      appointmentType = await prisma.doctorAppointmentType.findUnique({
        where: { id: appointment.appointmentTypeId },
        select: {
          id: true,
          name: true,
          duration: true,
          price: true,
          description: true,
        },
      });
    }

    // Combine appointment with appointment type
    return NextResponse.json({
      ...appointment,
      appointmentType,
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id] - Update appointment status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    // Check appointment access (handles authorization)
    const accessResult = await requireAppointmentAccess(id);
    if ("response" in accessResult) {
      return accessResult.response;
    }

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(updateAppointmentStatusSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { status } = validation.data;

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: status as AppointmentStatus },
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

