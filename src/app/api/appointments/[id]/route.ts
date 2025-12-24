import { NextRequest, NextResponse } from "next/server";
import { appointmentsServerService } from "@/lib/services/server";
import { updateAppointmentStatusSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requireAppointmentAccess } from "@/lib/server/rbac";
import { createNotFoundResponse, createServerErrorResponse } from "@/lib/utils/api-response";
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
      return createNotFoundResponse("Appointment");
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("[GET /api/appointments/[id]] Error:", error);
    return createServerErrorResponse("Failed to fetch appointment");
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
    console.error("[PUT /api/appointments/[id]] Error:", error);
    return createServerErrorResponse("Failed to update appointment");
  }
}

