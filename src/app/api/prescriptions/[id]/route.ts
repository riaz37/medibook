import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updatePrescriptionSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requirePrescriptionAccess } from "@/lib/server/prescription-utils";
import {
  createPrescriptionAudit,
  updatePrescriptionStatus,
} from "@/lib/server/prescription-utils";

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
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            speciality: true,
            imageUrl: true,
            bio: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        appointment: {
          select: {
            id: true,
            date: true,
            time: true,
            reason: true,
            status: true,
          },
        },
        items: {
          include: {
            medication: true,
            refills: {
              orderBy: { requestedAt: "desc" },
            },
          },
        },
        audits: {
          orderBy: { timestamp: "desc" },
          take: 10,
        },
      },
    });

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

    const { status, expiryDate, notes, items } = validation.data;

    // Get current prescription
    const currentPrescription = await prisma.prescription.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!currentPrescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: {
      status?: string;
      expiryDate?: Date | null;
      notes?: string | null;
    } = {};

    if (status !== undefined) {
      updateData.status = status;
    }
    if (expiryDate !== undefined) {
      updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Update prescription
    const updatedPrescription = await prisma.prescription.update({
      where: { id },
      data: updateData,
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
            refills: {
              orderBy: { requestedAt: "desc" },
            },
          },
        },
      },
    });

    // Update status if needed
    if (status) {
      await updatePrescriptionStatus(id, status as any);
    }

    // Create audit log
    const changes: Record<string, unknown> = {};
    if (status !== undefined) changes.status = status;
    if (expiryDate !== undefined) changes.expiryDate = expiryDate;
    if (notes !== undefined) changes.notes = notes;
    if (items !== undefined) changes.items = "updated";

    await createPrescriptionAudit(
      id,
      "UPDATED",
      context.userId,
      Object.keys(changes).length > 0 ? changes : undefined
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

