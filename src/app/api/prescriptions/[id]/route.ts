import { NextRequest, NextResponse } from "next/server";
import { prescriptionsServerService } from "@/lib/services/server";
import { updatePrescriptionSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requirePrescriptionAccess } from "@/lib/server/prescription-utils";

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
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(prescription);
  } catch (error) {
    console.error("Error fetching prescription:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescription" },
      { status: 500 }
    );
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

    // Only doctor or admin can update
    if (context.role !== "doctor" && context.role !== "admin") {
      return NextResponse.json(
        { error: "Only doctors can update prescriptions" },
        { status: 403 }
      );
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
    console.error("Error updating prescription:", error);
    return NextResponse.json(
      { error: "Failed to update prescription" },
      { status: 500 }
    );
  }
}

