import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { doctorsConfigService } from "@/lib/services/doctors-config.service";
import { doctorAvailabilitySchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requireAuth } from "@/lib/server/rbac";

// GET /api/doctors/[id]/config - Get doctor configuration
// Allows authenticated users (patients, doctors, admins) to read config for booking purposes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    // Verify doctor exists and is verified (for public booking access)
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: { isVerified: true },
    });

    if (!doctor || !doctor.isVerified) {
      return NextResponse.json(
        { error: "Doctor not found or not verified" },
        { status: 404 }
      );
    }

    const [availability, workingHours, appointmentTypes] = await Promise.all([
      doctorsConfigService.getAvailability(id),
      doctorsConfigService.getWorkingHours(id),
      doctorsConfigService.getAppointmentTypes(id),
    ]);

    return NextResponse.json({
      availability,
      workingHours,
      appointmentTypes,
    });
  } catch (error) {
    console.error("Error fetching doctor config:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctor configuration" },
      { status: 500 }
    );
  }
}

// PUT /api/doctors/[id]/config/availability - Update availability
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    if (context.role !== "admin" && context.doctorId !== id) {
      return NextResponse.json(
        { error: "Forbidden: You can only update your own configuration" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(doctorAvailabilitySchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const availability = await doctorsConfigService.updateAvailability(id, validation.data);

    return NextResponse.json(availability);
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 }
    );
  }
}

