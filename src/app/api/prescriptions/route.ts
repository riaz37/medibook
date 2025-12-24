import { NextRequest, NextResponse } from "next/server";
import { prescriptionsServerService } from "@/lib/services/server";
import { createPrescriptionSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requireAnyRole } from "@/lib/server/rbac";
import { createNotFoundResponse, createServerErrorResponse } from "@/lib/utils/api-response";

/**
 * POST /api/prescriptions - Create prescription (doctor only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require doctor or admin role
    const authResult = await requireAnyRole(["doctor", "admin"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { context } = authResult;
    const body = await request.json();

    // Validate request body
    const validation = validateRequest(createPrescriptionSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { appointmentId, patientId, items, expiryDate, notes } = validation.data;

    // Get doctor ID from context
    const doctorId = context.doctorId;
    if (!doctorId) {
      return createNotFoundResponse("Doctor profile");
    }

    // Create prescription with items (service handles validation and audit)
    const prescription = await prescriptionsServerService.create({
      appointmentId: appointmentId || null,
      doctorId,
      patientId,
      status: "ACTIVE",
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      notes: notes || null,
      changedBy: context.userId, // Pass userId for audit
      items: items.map((item) => ({
        medicationId: item.medicationId || null,
        medicationName: item.medicationName,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions || null,
        quantity: item.quantity || null,
        refillsAllowed: item.refillsAllowed ?? 0,
      })),
    });

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    console.error("[POST /api/prescriptions] Error:", error);
    return createServerErrorResponse("Failed to create prescription");
  }
}

