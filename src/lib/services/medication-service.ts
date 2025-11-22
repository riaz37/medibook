import prisma from "@/lib/prisma";
import type { MedicationSearchResult } from "@/lib/types/prescription";

/**
 * Medication Service
 * Handles medication database operations and search
 */

/**
 * Search medications by name or generic name
 */
export async function searchMedications(
  query: string,
  limit: number = 10
): Promise<MedicationSearchResult[]> {
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
  return medications.map((med) => ({
    id: med.id,
    name: med.name,
    genericName: med.genericName,
    dosageForms: JSON.parse(med.dosageForms || "[]") as string[],
    strengths: JSON.parse(med.strengths || "[]") as string[],
    description: med.description,
  }));
}

/**
 * Get medication by ID
 */
export async function getMedicationById(
  id: string
): Promise<MedicationSearchResult | null> {
  const medication = await prisma.medication.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      genericName: true,
      dosageForms: true,
      strengths: true,
      description: true,
    },
  });

  if (!medication) {
    return null;
  }

  return {
    id: medication.id,
    name: medication.name,
    genericName: medication.genericName,
    dosageForms: JSON.parse(medication.dosageForms || "[]") as string[],
    strengths: JSON.parse(medication.strengths || "[]") as string[],
    description: medication.description,
  };
}

/**
 * Create or update medication (admin only - for future use)
 */
export async function upsertMedication(data: {
  name: string;
  genericName?: string;
  dosageForms: string[];
  strengths: string[];
  description?: string;
  isActive?: boolean;
}) {
  // This would be used for admin medication management
  // For now, medications should be seeded or imported
  return prisma.medication.create({
    data: {
      name: data.name,
      genericName: data.genericName || null,
      dosageForms: JSON.stringify(data.dosageForms),
      strengths: JSON.stringify(data.strengths),
      description: data.description || null,
      isActive: data.isActive ?? true,
    },
  });
}

