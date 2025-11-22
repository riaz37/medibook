import { NextRequest, NextResponse } from "next/server";
import { requirePrescriptionAccess } from "@/lib/server/prescription-utils";
import prisma from "@/lib/prisma";
import { generatePrescriptionPDF } from "@/lib/services/pdf.service";

/**
 * GET /api/prescriptions/[id]/pdf - Download prescription PDF
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
          },
        },
        items: {
          include: {
            medication: true,
          },
        },
      },
    });

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generatePrescriptionPDF(prescription);

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="prescription-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating prescription PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

