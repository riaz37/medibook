import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { doctorsConfigService } from "@/lib/services/doctors-config.service";
import { createAppointmentTypeSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";

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
      return NextResponse.json(
        { error: "Doctor not found or not verified" },
        { status: 404 }
      );
    }

    const types = await doctorsConfigService.getAppointmentTypes(id);
    return NextResponse.json(types);
  } catch (error) {
    console.error("Error fetching appointment types:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment types" },
      { status: 500 }
    );
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
    
    // Middleware ensures user is authenticated and has doctor/admin role
    const { getAuthContext } = await import("@/lib/server/auth-utils");
    const context = await getAuthContext();
    
    if (!context || (context.role !== "admin" && context.doctorId !== id)) {
      return NextResponse.json(
        { error: "Forbidden: You can only create appointment types for your own profile" },
        { status: 403 }
      );
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

    return NextResponse.json(type);
  } catch (error) {
    console.error("Error creating appointment type:", error);
    return NextResponse.json(
      { error: "Failed to create appointment type" },
      { status: 500 }
    );
  }
}

