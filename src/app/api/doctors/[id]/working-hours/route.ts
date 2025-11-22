import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { doctorsConfigService } from "@/lib/services/doctors-config.service";
import { updateWorkingHoursSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";

/**
 * GET /api/doctors/[id]/working-hours - Get working hours (doctor only)
 */
export async function GET(
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
        { error: "Forbidden: You can only access your own working hours" },
        { status: 403 }
      );
    }

    const workingHours = await doctorsConfigService.getWorkingHours(id);
    return NextResponse.json(workingHours);
  } catch (error) {
    console.error("Error fetching working hours:", error);
    return NextResponse.json(
      { error: "Failed to fetch working hours" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/doctors/[id]/working-hours - Update working hours (doctor only)
 */
export async function PUT(
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
        { error: "Forbidden: You can only update your own working hours" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(updateWorkingHoursSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const result = await doctorsConfigService.updateWorkingHours(id, validation.data.workingHours);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Error updating working hours:", error);
    return NextResponse.json(
      { error: "Failed to update working hours" },
      { status: 500 }
    );
  }
}

