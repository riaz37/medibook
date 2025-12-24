import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requestRefillSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requirePrescriptionAccess } from "@/lib/server/prescription-utils";

/**
 * POST /api/prescriptions/[id]/refill/[itemId]/request - Request refill (patient only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;

    // Check prescription access (patient must own prescription)
    const accessResult = await requirePrescriptionAccess(id);
    if ("response" in accessResult) {
      return accessResult.response;
    }

    const { context } = accessResult;

    // Only patient can request refill
    if (context.role !== "patient" && context.role !== "admin") {
      return NextResponse.json(
        { error: "Only patients can request refills" },
        { status: 403 }
      );
    }

    // Get patient ID from DB (context.userId is already the DB user ID)
    const dbUser = await prisma.user.findUnique({
      where: { id: context.userId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(requestRefillSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { notes } = validation.data;

    // Verify prescription item exists and belongs to prescription
    const prescriptionItem = await prisma.prescriptionItem.findFirst({
      where: {
        id: itemId,
        prescriptionId: id,
      },
      include: {
        prescription: {
          select: {
            status: true,
            patientId: true,
          },
        },
      },
    });

    if (!prescriptionItem) {
      return NextResponse.json(
        { error: "Prescription item not found" },
        { status: 404 }
      );
    }

    // Verify patient owns the prescription
    if (prescriptionItem.prescription.patientId !== dbUser.id) {
      return NextResponse.json(
        { error: "You don't have access to this prescription" },
        { status: 403 }
      );
    }

    // Check if prescription is active
    if (prescriptionItem.prescription.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Can only request refills for active prescriptions" },
        { status: 400 }
      );
    }

    // Check if refills remaining
    if (prescriptionItem.refillsRemaining <= 0) {
      return NextResponse.json(
        { error: "No refills remaining for this medication" },
        { status: 400 }
      );
    }

    // Check if there's already a pending refill
    const existingRefill = await prisma.prescriptionRefill.findFirst({
      where: {
        prescriptionItemId: itemId,
        status: "PENDING",
      },
    });

    if (existingRefill) {
      return NextResponse.json(
        { error: "Refill request already pending" },
        { status: 409 }
      );
    }

    // Create refill request
    const refill = await prisma.prescriptionRefill.create({
      data: {
        prescriptionItemId: itemId,
        requestedBy: dbUser.id,
        status: "PENDING",
        notes: notes || null,
      },
      include: {
        prescriptionItem: {
          include: {
            medication: true,
          },
        },
      },
    });

    return NextResponse.json(refill, { status: 201 });
  } catch (error) {
    console.error("Error requesting refill:", error);
    return NextResponse.json(
      { error: "Failed to request refill" },
      { status: 500 }
    );
  }
}

