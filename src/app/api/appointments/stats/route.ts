import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/appointments/stats - Get user appointment statistics
export async function GET(request: NextRequest) {
  try {
    // Middleware ensures user is authenticated
    const { getAuthContext } = await import("@/lib/utils/auth-utils");
    const context = await getAuthContext();
    
    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Filter based on role
    let whereClause: any = {};
    if (context.role === "patient") {
      // Get DB user ID for patient
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: context.clerkUserId },
        select: { id: true },
      });
      if (dbUser) {
        whereClause.userId = dbUser.id;
      } else {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    } else if (context.role === "doctor" && context.doctorId) {
      whereClause.doctorId = context.doctorId;
    }
    // Admin sees all (no filter)

    // these calls will run in parallel, instead of waiting each other
    const [totalCount, completedCount] = await Promise.all([
      prisma.appointment.count({
        where: whereClause,
      }),
      prisma.appointment.count({
        where: {
          ...whereClause,
          status: "COMPLETED",
        },
      }),
    ]);

    return NextResponse.json({
      totalAppointments: totalCount,
      completedAppointments: completedCount,
    });
  } catch (error) {
    console.error("Error fetching user appointment stats:", error);
    return NextResponse.json(
      { totalAppointments: 0, completedAppointments: 0 },
      { status: 200 }
    );
  }
}

