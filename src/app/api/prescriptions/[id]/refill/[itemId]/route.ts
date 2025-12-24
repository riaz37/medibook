import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { processRefillSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requirePrescriptionAccess } from "@/lib/server/prescription-utils";

/**
 * POST /api/prescriptions/[id]/refill/[itemId] - Approve/reject refill (doctor only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;

    // Check prescription access (must be doctor who created it)
    const accessResult = await requirePrescriptionAccess(id);
    if ("response" in accessResult) {
      return accessResult.response;
    }

    const { context } = accessResult;

    // Only doctor or admin can approve/reject refills
    if (context.role !== "doctor" && context.role !== "admin") {
      return NextResponse.json(
        { error: "Only doctors can process refill requests" },
        { status: 403 }
      );
    }

    // Get doctor ID from DB (context.userId is already the DB user ID)
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
    const validation = validateRequest(processRefillSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { status, notes } = validation.data;

    // Find pending refill request
    const refill = await prisma.prescriptionRefill.findFirst({
      where: {
        prescriptionItemId: itemId,
        status: "PENDING",
      },
      include: {
        prescriptionItem: {
          include: {
            prescription: {
              select: {
                doctorId: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!refill) {
      return NextResponse.json(
        { error: "Pending refill request not found" },
        { status: 404 }
      );
    }

    // Verify doctor owns the prescription
    if (refill.prescriptionItem.prescription.doctorId !== context.doctorId) {
      return NextResponse.json(
        { error: "You don't have access to this prescription" },
        { status: 403 }
      );
    }

    // Update refill status
    const updatedRefill = await prisma.prescriptionRefill.update({
      where: { id: refill.id },
      data: {
        status: status as "APPROVED" | "REJECTED",
        approvedBy: dbUser.id,
        approvedAt: new Date(),
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

    // If approved, update refills remaining
    if (status === "APPROVED") {
      await prisma.prescriptionItem.update({
        where: { id: itemId },
        data: {
          refillsRemaining: {
            decrement: 1,
          },
        },
      });
    }

    return NextResponse.json(updatedRefill);
  } catch (error) {
    console.error("Error processing refill:", error);
    return NextResponse.json(
      { error: "Failed to process refill" },
      { status: 500 }
    );
  }
}

