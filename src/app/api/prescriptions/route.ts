import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createPrescriptionSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requireAnyRole } from "@/lib/server/auth-utils";
import {
  validatePrescriptionData,
  createPrescriptionAudit,
} from "@/lib/server/prescription-utils";

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
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 }
      );
    }

    // Validate prescription data (appointment, patient, doctor)
    const dataValidation = await validatePrescriptionData({
      appointmentId: appointmentId || null,
      patientId,
      doctorId,
    });

    if (!dataValidation.valid) {
      return NextResponse.json(
        { error: dataValidation.error },
        { status: dataValidation.status }
      );
    }

    // Create prescription with items
    const prescription = await prisma.prescription.create({
      data: {
        appointmentId: appointmentId || null,
        doctorId,
        patientId,
        status: "ACTIVE",
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        notes: notes || null,
        items: {
          create: items.map((item) => ({
            medicationId: item.medicationId || null,
            medicationName: item.medicationName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions || null,
            quantity: item.quantity || null,
            refillsAllowed: item.refillsAllowed,
            refillsRemaining: item.refillsAllowed,
          })),
        },
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            speciality: true,
            imageUrl: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            date: true,
            time: true,
            reason: true,
          },
        },
        items: {
          include: {
            medication: true,
          },
        },
      },
    });

    // Create audit log
    await createPrescriptionAudit(
      prescription.id,
      "CREATED",
      context.userId,
      {
        appointmentId,
        patientId,
        itemCount: items.length,
      }
    );

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return NextResponse.json(
      { error: "Failed to create prescription" },
      { status: 500 }
    );
  }
}

