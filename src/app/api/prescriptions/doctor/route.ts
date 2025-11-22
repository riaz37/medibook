import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAnyRole } from "@/lib/server/auth-utils";

/**
 * GET /api/prescriptions/doctor - List doctor's prescriptions
 */
export async function GET(request: NextRequest) {
  try {
    // Require doctor or admin role
    const authResult = await requireAnyRole(["doctor", "admin"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { context } = authResult;
    const { searchParams } = new URL(request.url);

    // Get doctor ID
    const doctorId = context.doctorId;
    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 }
      );
    }

    // Query parameters
    const status = searchParams.get("status");
    const patientId = searchParams.get("patientId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: {
      doctorId: string;
      status?: string;
      patientId?: string;
    } = {
      doctorId,
    };

    if (status) {
      where.status = status;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    // Get prescriptions
    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        include: {
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
            },
          },
          items: {
            include: {
              medication: true,
              refills: {
                where: { status: "PENDING" },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.prescription.count({ where }),
    ]);

    return NextResponse.json({
      prescriptions,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching doctor prescriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
}

