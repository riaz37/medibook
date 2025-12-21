import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { medicationSearchSchema } from "@/lib/validations";
import { validateQuery } from "@/lib/utils/validation";
import { requireAuth } from "@/lib/server/rbac";

// Cache for 10 minutes (medications don't change frequently)
export const revalidate = 600;

/**
 * GET /api/medications/search - Search medication database
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const queryParams: Record<string, string> = {};
    if (searchParams.get("query")) {
      queryParams.query = searchParams.get("query") || "";
    }
    if (searchParams.get("limit")) {
      queryParams.limit = searchParams.get("limit") || "10";
    }

    const validation = validateQuery(medicationSearchSchema, queryParams);
    if (!validation.success) {
      return validation.response;
    }

    const { query, limit } = validation.data;

    // Search medications (case-insensitive)
    const medications = await prisma.medication.findMany({
      where: {
        isActive: true,
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            genericName: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      take: limit,
      orderBy: [
        {
          name: "asc",
        },
      ],
      select: {
        id: true,
        name: true,
        genericName: true,
        dosageForms: true,
        strengths: true,
        description: true,
      },
    });

    // Parse JSON fields
    const formattedMedications = medications.map((med) => ({
      id: med.id,
      name: med.name,
      genericName: med.genericName,
      dosageForms: JSON.parse(med.dosageForms || "[]") as string[],
      strengths: JSON.parse(med.strengths || "[]") as string[],
      description: med.description,
    }));

    return NextResponse.json({
      medications: formattedMedications,
      count: formattedMedications.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    console.error("Error searching medications:", error);
    return NextResponse.json(
      { error: "Failed to search medications" },
      { status: 500 }
    );
  }
}

