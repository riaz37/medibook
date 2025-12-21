import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { doctorsConfigService } from "@/lib/services/doctors-config.service";
import { updateAppointmentTypeSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";

/**
 * PUT /api/doctors/[id]/appointment-types/[typeId] - Update appointment type (doctor only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id, typeId } = await params;
    
    const { requireAuth } = await import("@/lib/server/rbac");
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    if (context.role !== "admin" && context.doctorId !== id) {
      return NextResponse.json(
        { error: "Forbidden: You can only update appointment types for your own profile" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(updateAppointmentTypeSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    // Normalize data: convert null to undefined for optional fields
    const normalizedData = {
      ...validation.data,
      description: validation.data.description ?? undefined,
      price: validation.data.price ?? undefined,
    };

    const type = await doctorsConfigService.updateAppointmentType(
      typeId,
      id,
      normalizedData
    );

    return NextResponse.json(type);
  } catch (error) {
    console.error("Error updating appointment type:", error);
    return NextResponse.json(
      { error: "Failed to update appointment type" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/doctors/[id]/appointment-types/[typeId] - Delete appointment type (doctor only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id, typeId } = await params;
    
    const { requireAuth } = await import("@/lib/server/rbac");
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    if (context.role !== "admin" && context.doctorId !== id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete appointment types for your own profile" },
        { status: 403 }
      );
    }

    await doctorsConfigService.deleteAppointmentType(typeId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting appointment type:", error);
    return NextResponse.json(
      { error: "Failed to delete appointment type" },
      { status: 500 }
    );
  }
}

