import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAnyRole } from "@/lib/server/auth-utils";

/**
 * GET /api/prescriptions/patient - List patient's prescriptions
 */
export async function GET(request: NextRequest) {
  try {
    // Require patient or admin role
    const authResult = await requireAnyRole(["patient", "admin"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { context } = authResult;
    const { searchParams } = new URL(request.url);

    // Get patient ID from DB user
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: context.userId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Query parameters
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: {
      patientId: string;
      status?: string;
    } = {
      patientId: dbUser.id,
    };

    if (status) {
      where.status = status;
    }

    // Get prescriptions
    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
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
                orderBy: { requestedAt: "desc" },
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
    console.error("Error fetching patient prescriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
}

