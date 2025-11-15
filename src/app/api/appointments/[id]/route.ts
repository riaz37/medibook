import { NextRequest, NextResponse } from "next/server";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { updateAppointmentStatusSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requireAppointmentAccess } from "@/lib/server/auth-utils";

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

