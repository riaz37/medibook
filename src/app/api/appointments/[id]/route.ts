import { NextRequest, NextResponse } from "next/server";
import { appointmentsServerService } from "@/lib/services/server";
import { updateAppointmentStatusSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requireAppointmentAccess } from "@/lib/server/rbac";
import { AppointmentStatus } from "@/generated/prisma/client";

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

    const appointment = await appointmentsServerService.findUniqueWithType(id);

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
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

    // Update appointment status with business logic validation
    const updatedAppointment = await appointmentsServerService.updateStatus(
      id,
      status as AppointmentStatus
    );

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

