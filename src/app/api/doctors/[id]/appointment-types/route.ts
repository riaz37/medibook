import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { doctorsConfigService } from "@/lib/services/doctors-config.service";
import { createAppointmentTypeSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requireAuth } from "@/lib/server/rbac";
import { createNotFoundResponse, createForbiddenResponse, createServerErrorResponse } from "@/lib/utils/api-response";

// GET /api/doctors/[id]/appointment-types - Get appointment types (public for booking)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;
    
    // Verify doctor exists and is verified
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: { isVerified: true },
    });

    if (!doctor || !doctor.isVerified) {
      return createNotFoundResponse("Doctor");
    }

    const types = await doctorsConfigService.getAppointmentTypes(id);
    return NextResponse.json(types);
  } catch (error) {
    console.error("[GET /api/doctors/[id]/appointment-types] Error:", error);
    return createServerErrorResponse("Failed to fetch appointment types");
  }
}

// POST /api/doctors/[id]/appointment-types - Create appointment type
export async function POST(
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
      return createForbiddenResponse("You can only create appointment types for your own profile");
    }

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(createAppointmentTypeSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    // Normalize data: convert null to undefined for optional fields
    const normalizedData = {
      ...validation.data,
      description: validation.data.description ?? undefined,
      price: validation.data.price ?? undefined,
    };

    const type = await doctorsConfigService.createAppointmentType(id, normalizedData);

    return NextResponse.json(type, { status: 201 });
  } catch (error) {
    console.error("[POST /api/doctors/[id]/appointment-types] Error:", error);
    return createServerErrorResponse("Failed to create appointment type");
  }
}
