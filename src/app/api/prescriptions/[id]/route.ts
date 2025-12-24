import { NextRequest, NextResponse } from "next/server";
import { prescriptionsServerService } from "@/lib/services/server";
import { updatePrescriptionSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requirePrescriptionAccess } from "@/lib/server/prescription-utils";
import { createNotFoundResponse, createServerErrorResponse, createForbiddenResponse } from "@/lib/utils/api-response";

/**
 * GET /api/prescriptions/[id] - Get prescription details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check prescription access
    const accessResult = await requirePrescriptionAccess(id);
    if ("response" in accessResult) {
      return accessResult.response;
    }

    // Get prescription with all details
    const prescription = await prescriptionsServerService.findUnique(id);

    if (!prescription) {
      return createNotFoundResponse("Prescription");
    }

    return NextResponse.json(prescription);
  } catch (error) {
    console.error("[GET /api/prescriptions/[id]] Error:", error);
    return createServerErrorResponse("Failed to fetch prescription");
  }
}

/**
 * PUT /api/prescriptions/[id] - Update prescription (doctor only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check prescription access (must be doctor who created it)
    const accessResult = await requirePrescriptionAccess(id);
    if ("response" in accessResult) {
      return accessResult.response;
    }

    const { context } = accessResult;

    // Only verified doctors (not pending) or admin can update
    if (context.role !== "doctor" && context.role !== "admin") {
      return createForbiddenResponse("Only verified doctors can update prescriptions");
    }

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(updatePrescriptionSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { status, expiryDate, notes } = validation.data;

    // Update prescription (service handles status logic and audit)
    const updatedPrescription = await prescriptionsServerService.update(
      id,
      {
        status: status as any,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        notes: notes || null,
      },
      context.userId
    );

    return NextResponse.json(updatedPrescription);
  } catch (error) {
    console.error("[PUT /api/prescriptions/[id]] Error:", error);
    return createServerErrorResponse("Failed to update prescription");
  }
}

