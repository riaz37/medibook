import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/server/rbac";
import { createNotFoundResponse, createServerErrorResponse } from "@/lib/utils/api-response";

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
      return createNotFoundResponse("Medication");
    }

    // Parse JSON fields
    const formattedMedication = {
      ...medication,
      dosageForms: JSON.parse(medication.dosageForms || "[]") as string[],
      strengths: JSON.parse(medication.strengths || "[]") as string[],
    };

    return NextResponse.json(formattedMedication);
  } catch (error) {
    console.error("[GET /api/medications/[id]] Error:", error);
    return createServerErrorResponse("Failed to fetch medication");
  }
}

