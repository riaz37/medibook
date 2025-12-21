import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/server/rbac";

/**
 * GET /api/medications/[id] - Get medication details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }

    const { id } = await params;

    const medication = await prisma.medication.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        genericName: true,
        dosageForms: true,
        strengths: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!medication) {
      return NextResponse.json(
        { error: "Medication not found" },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const formattedMedication = {
      ...medication,
      dosageForms: JSON.parse(medication.dosageForms || "[]") as string[],
      strengths: JSON.parse(medication.strengths || "[]") as string[],
    };

    return NextResponse.json(formattedMedication);
  } catch (error) {
    console.error("Error fetching medication:", error);
    return NextResponse.json(
      { error: "Failed to fetch medication" },
      { status: 500 }
    );
  }
}

