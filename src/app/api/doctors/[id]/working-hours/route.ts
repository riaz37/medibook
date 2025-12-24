import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { doctorsConfigService } from "@/lib/services/doctors-config.service";
import { updateWorkingHoursSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requireAuth } from "@/lib/server/rbac";
import { createForbiddenResponse, createServerErrorResponse } from "@/lib/utils/api-response";

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
    
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    if (context.role !== "admin" && context.doctorId !== id) {
      return createForbiddenResponse("You can only access your own working hours");
    }

    const workingHours = await doctorsConfigService.getWorkingHours(id);
    return NextResponse.json(workingHours);
  } catch (error) {
    console.error("[GET /api/doctors/[id]/working-hours] Error:", error);
    return createServerErrorResponse("Failed to fetch working hours");
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
    
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    if (context.role !== "admin" && context.doctorId !== id) {
      return createForbiddenResponse("You can only update your own working hours");
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
    console.error("[PUT /api/doctors/[id]/working-hours] Error:", error);
    return createServerErrorResponse("Failed to update working hours");
  }
}

