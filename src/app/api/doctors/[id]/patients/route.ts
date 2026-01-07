import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/rbac";
import { appointmentsServerService } from "@/lib/services/server";
import { createNotFoundResponse, createServerErrorResponse } from "@/lib/utils/api-response";
import prisma from "@/lib/prisma";

/**
 * GET /api/doctors/[id]/patients - Get unique patients for a doctor
 * Returns list of patients who have appointments with this doctor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }

    const { context } = authResult;
    const { id: doctorId } = await params;

    // Verify doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true },
    });

    if (!doctor) {
      return createNotFoundResponse("Doctor");
    }

    // Verify the authenticated user is this doctor or an admin
    if (context.role !== "admin" && context.doctorId !== doctorId) {
      return NextResponse.json(
        { error: "Forbidden: You can only view your own patients" },
        { status: 403 }
      );
    }

    // Get unique patients from appointments
    const appointments = await appointmentsServerService.getByDoctor(doctorId, {
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Extract unique patients
    const patientMap = new Map<string, { id: string; firstName: string | null; lastName: string | null; email: string }>();
    
    appointments.forEach((apt: any) => {
      if (apt.user && !patientMap.has(apt.user.id)) {
        patientMap.set(apt.user.id, {
          id: apt.user.id,
          firstName: apt.user.firstName,
          lastName: apt.user.lastName,
          email: apt.user.email,
        });
      }
    });

    const patients = Array.from(patientMap.values()).sort((a, b) => {
      const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim() || a.email;
      const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim() || b.email;
      return nameA.localeCompare(nameB);
    });

    return NextResponse.json({ patients });
  } catch (error) {
    console.error("[GET /api/doctors/[id]/patients] Error:", error);
    return createServerErrorResponse("Failed to fetch patients");
  }
}

